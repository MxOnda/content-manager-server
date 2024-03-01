import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";

import { User } from "@prisma/client";

import { RegisterUserDto, SigninUserDto } from "./dtos";
import { EmailerService } from "src/emailer/emailer.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { ResetPasswordChangeDto } from "./dtos/reset-password-change.dto";
import { DeactivateAccountDto } from "./dtos/deactivate-account.dto";
import { ReactivateAccountDto } from "./dtos/reactivate-account.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailer: EmailerService,
  ) {}

  async register(args: RegisterUserDto) {
    const userExists = await this.prisma.user.findUnique({ where: { email: args.email } });

    console.log(userExists);
    

    let userId: string | null = null;

    if (userExists) {
      if (userExists.status === "ACTIVE") {
        throw new BadRequestException({ message: "El correo electrónico ya está registrado." });
      }

      userId = userExists.id;
    } else {
      const user = await this.prisma.user.create({
        data: { fullname: args.fullname, email: args.email, password: args.password, profilePicture: "" },
        select: { id: true, fullname: true, email: true, createdAt: true },
      });

      userId = user.id;
    }

    await this.sendInvitation(userId, args.email);

    return {
      message: "Invitación enviada",
      data: null,
    };
  }

  async sendInvitation(userId: string, email: string) {
    const token = this.jwtService.sign(
      { id: userId },
      {
        secret: this.configService.get<string>("JWT_INVITATION_SECRECT_KEY"),
        expiresIn: this.configService.get<string>("JWT_INVITATION_EXPIRES_IN"),
      },
    );

    await this.emailer.sendEmail({
      email,
      subject: "Confirma tu correo electrónico",
      html: `<a href="${this.configService.get("FRONTEND_URL")}/confirm-email?token=${token}">Confirma tu correo electrónico</a>`,
    });
  }

  async signin(args: SigninUserDto) {
    const userFound = await this.prisma.user.findUnique({ where: { email: args.email, status: "ACTIVE" } });

    if (!userFound)
      throw new BadRequestException({ message: "Al parecer tu correo electrónico o contraseña son incorrectos." });

    if (userFound.password !== args.password)
      throw new BadRequestException({ message: "Al parecer tu correo electrónico o contraseña son incorrectos." });

    const token = await this.generateAccessToken(userFound);

    const { password, role, status, ...user } = userFound;

    return {
      message: "Usuario autenticado exitosamente.",
      data: { user, token },
    };
  }

  async confirmEmail({ token }: { token: string }) {
    try {
      const { id } = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_INVITATION_SECRECT_KEY"),
      }) as { id: string };

      const userFound = await this.prisma.user.findUnique({ where: { id, status: "PENDING" } });

      if (!userFound) throw new BadRequestException({ message: "No se encontró el usuario." });

      await this.prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });

      const accessToken = await this.generateAccessToken(userFound);

      userFound.status = "ACTIVE";

      return { message: "Usuario confirmado exitosamente.", data: { user: userFound, token: accessToken } };
    } catch (err) {
      console.log(err);

      throw new BadRequestException({ message: "Esta invitación no es válida" });
    }
  }

  private async generateAccessToken(user: User) {
    const payload = { id: user.id, fullname: user.fullname, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_TOKEN_SECRET_KEY"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_TOKEN_EXPIRES_IN"),
    });

    return accessToken;
  }

  async changePassword(userId: string, args: ChangePasswordDto) {
    const userFound = await this.prisma.user.findUnique({ where: { id: userId, status: "ACTIVE" } });

    if (!userFound) throw new BadRequestException({ message: "No se encontró el usuario." });

    if (userFound.password !== args.currentPassword)
      throw new BadRequestException({ message: "La contraseña actual es incorrecta." });

    await this.prisma.user.update({ where: { id: userId }, data: { password: args.newPassword } });

    return { message: "Contraseña actualizada exitosamente.", data: null };
  }

  async resetPassword({ email }: ResetPasswordDto) {
    const userFound = await this.prisma.user.findUnique({ where: { email, status: "ACTIVE" } });

    if (!userFound) throw new BadRequestException({ message: "Este correo electrónico no está registrado." });

    const token = this.jwtService.sign(
      { id: userFound.id },
      {
        secret: this.configService.get<string>("JWT_RESET_PASSWORD_SECRET_KEY"),
        expiresIn: this.configService.get<string>("JWT_RESET_PASSWORD_EXPIRES_IN"),
      },
    );

    await this.emailer.sendEmail({
      email,
      subject: "Restablece tu contraseña",
      html: `<a href="${this.configService.get("FRONTEND_URL")}/reset-password/change?token=${token}">Restablece tu contraseña</a>`,
    });

    return { message: "Se envió un correo electrónico para restablecer la contraseña.", data: null };
  }

  async resetPasswordChange(token: string, args: ResetPasswordChangeDto) {
    try {
      const { id } = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_RESET_PASSWORD_SECRET_KEY"),
      }) as { id: string };

      const userFound = await this.prisma.user.findUnique({ where: { id, status: "ACTIVE" } });

      if (!userFound) throw new BadRequestException({ message: "No se encontró el usuario." });

      if (args.confirmNewPassword !== args.newPassword)
        throw new BadRequestException({ message: "Las contraseñas no coinciden." });

      await this.prisma.user.update({ where: { id }, data: { password: args.newPassword } });

      return { message: "Contraseña restablecida exitosamente.", data: null };
    } catch (err) {
      throw new BadRequestException({ message: "La solicitud de cambio de contraseña no es válida." });
    }
  }

  async deactivateAccount(userId: string, args: DeactivateAccountDto) {
    const userFound = await this.prisma.user.findUnique({ where: { id: userId, status: "ACTIVE" } });

    if (!userFound) throw new BadRequestException({ message: "No se encontró el usuario." });

    await this.prisma.user.update({ where: { id: userId }, data: { status: "INACTIVE" } });

    return { message: "Cuenta desactivada exitosamente.", data: null };
  }

  async reactivateAccount(args: ReactivateAccountDto) {
    const userFound = await this.prisma.user.findUnique({ where: { id: args.userId, status: "INACTIVE" } });

    if (!userFound) throw new BadRequestException({ message: "No se encontró el usuario." });

    await this.prisma.user.update({ where: { id: args.userId }, data: { status: "ACTIVE" } });

    return { message: "Cuenta reactivada exitosamente.", data: null };
  }
}
