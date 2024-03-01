import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { DigitaloceanSpacesService } from "src/content-manager/digitalocean-spaces.service";
import { UpdateProfileDto } from "./dtos/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digitaloceanSpacesService: DigitaloceanSpacesService,
  ) {}

  async retrieveSocialNetworks(userId: string) {
    const socialNetworks = await this.prisma.socialNetworks.findMany({
      where: { ownerId: userId, isDeleted: false },
      include: { profile: true },
    });

    return {
      message: "Redes sociales obtenidas correctamente.",
      data: socialNetworks,
    };
  }

  async retrieveUserContents(userId: string) {
    const contents = await this.prisma.content.findMany({
      where: { userId: userId },
      include: { socialNetwork: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Contenidos obtenidos correctamente.",
      data: contents,
    };
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const { multimediaUrl } = await this.digitaloceanSpacesService.upload(file, "profile-pictures");

    if (!multimediaUrl)
      throw new BadRequestException({ message: "No se ha podido actualizar la imagen de perfil.", data: null });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: multimediaUrl,
      },
    });

    return user;
  }

  async updateProfile(userId: string, body: UpdateProfileDto) {
    const response = await this.prisma.user.update({ where: { id: userId }, data: { fullname: body.name } });

    return {
      message: "Perfil actualizado correctamente.",
      data: response,
    };
  }
}
