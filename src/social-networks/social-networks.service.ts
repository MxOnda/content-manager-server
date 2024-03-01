import { BadRequestException, Injectable } from "@nestjs/common";

import { RegisterSocialNetworkDto } from "./dtos/register-social-network";
import { PrismaService } from "src/common/prisma.service";

// @ts-ignore
import * as Cryptr from "cryptr";
import { InstagramProvider } from "src/content-manager/providers/instagram.provider";
import { ConfigService } from "@nestjs/config";
import { ChangePasswordDto } from "./dtos/change-password";

@Injectable()
export class SocialNetworksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramProvider: InstagramProvider,
    private readonly configService: ConfigService,
  ) {}

  async register(userId: string, args: RegisterSocialNetworkDto) {
    const socialNetworkExists = await this.prisma.socialNetworks.findFirst({
      where: { identifier: args.identifier, socialNetwork: args.socialNetwork, isDeleted: false },
    });

    if (socialNetworkExists)
      return new BadRequestException({ message: "La red social ya se encuentra registrada.", data: null });

    const isCredentialsValid = await this.instagramProvider.validateCredentials(args.identifier, args.password);

    if (!isCredentialsValid)
      return new BadRequestException({ message: "Las credenciales no son válidas.", data: null });

    const cryptr = new Cryptr(this.configService.get<string>("CRYPTO_SECRET")!);
    const encryptedPassword = cryptr.encrypt(args.password);

    const profile = await this.instagramProvider.getProfile(args.identifier, encryptedPassword);

    if (!profile) {
      return new BadRequestException({
        message: "No se pudo obtener el perfil de la red social.",
        data: null,
      });
    }

    const socialNetwork = await this.prisma.socialNetworks.create({
      data: {
        ...args,
        password: encryptedPassword,
        ownerId: userId,
        email: profile.email,
        profile: {
          create: {
            avatarUrl: profile.avatar,
            bio: profile.bio,
            fullname: profile.fullname,
            username: profile.username,
          },
        },
      },
    });

    const { password, ...socialNetworkWithoutPassword } = socialNetwork;

    return { message: "Red social registrada exitosamente.", data: { socialNetwork: socialNetworkWithoutPassword } };
  }

  async findByUserId(userId: string) {
    const socialNetworks = await this.prisma.socialNetworks.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: { id: true, identifier: true, socialNetwork: true, lastActivity: true, createdAt: true },
    });

    return { message: "Redes sociales encontradas exitosamente.", data: { socialNetworks } };
  }

  async changePassword(userId: string, id: string, body: ChangePasswordDto) {
    const socialNetworkExists = await this.prisma.socialNetworks.findFirst({
      where: { id, ownerId: userId },
    });

    if (!socialNetworkExists) return new BadRequestException({ message: "La red social no existe.", data: null });

    const isCredentialsValid = await this.instagramProvider.validateCredentials(
      socialNetworkExists.identifier,
      body.newPassword,
    );

    if (!isCredentialsValid)
      return new BadRequestException({ message: "Las credenciales no son válidas.", data: null });

    if (body.newPassword !== body.confirmNewPassword)
      return new BadRequestException({ message: "Las contraseñas no coinciden.", data: null });

    const cryptr = new Cryptr(this.configService.get<string>("CRYPTO_SECRET")!);

    const encryptedPassword = cryptr.encrypt(body.newPassword);

    await this.prisma.socialNetworks.update({ where: { id }, data: { password: encryptedPassword } });

    return { message: "Contraseña actualizada exitosamente.", data: null };
  }

  async remove(id: string) {
    await this.prisma.socialNetworks.update({ where: { id }, data: { isDeleted: true } });

    return { message: "Red social eliminada exitosamente.", data: null };
  }

  async retrieveProfile(id: string) {
    const socialNetwork = await this.prisma.socialNetworks.findFirst({ where: { id } });

    if (!socialNetwork) return new BadRequestException({ message: "La red social no existe.", data: null });

    const profile = await this.prisma.socialNetworkProfile.findFirst({ where: { socialNetworkId: id } });

    return { message: "Perfil encontrado exitosamente.", data: { profile } };
  }

  async retrieveContent(id: string) {
    const socialNetwork = await this.prisma.socialNetworks.findFirst({ where: { id } });

    if (!socialNetwork) return new BadRequestException({ message: "La red social no existe.", data: null });

    let contents = await this.prisma.content.findMany({
      where: { socialNetworkId: id },
      select: {
        id: true,
        caption: true,
        multimediaUrl: true,
        scheduledAt: true,
        socialNetworkId: true,
        type: true,
        uploadedAt: true,
        url: true,
        socialNetwork: true,
      },
    });

    return {
      message: "Contenidos encontrados exitosamente.",
      data: {
        contents: contents.map((content) => {
          // remove only password
          const { password, ...socialNetworkWithoutPassword } = content.socialNetwork;
          return { ...content, socialNetwork: socialNetworkWithoutPassword };
        }),
      },
    };
  }
}
