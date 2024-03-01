import { BadRequestException, Injectable } from "@nestjs/common";

import * as Dtos from "./dtos";

import { PrismaService } from "src/common/prisma.service";
import { CreateContentResponse, InstagramProvider } from "src/content-manager/providers/instagram.provider";
import { DigitaloceanSpacesService } from "./digitalocean-spaces.service";


@Injectable()
export class ContentManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramProvider: InstagramProvider,
    private readonly digitaloceanSpacesService: DigitaloceanSpacesService,
  ) {}

  async publish(args: Dtos.PublishDto, file: Express.Multer.File) {
    const { isScheduled: isScheduledStr, scheduledAt } = args;

    const isScheduled = isScheduledStr === "true";

    // Subo la imagen a digitalocean
    const { multimediaUrl } = await this.digitaloceanSpacesService.upload(file, "profile-picture");

    if (!multimediaUrl) throw new BadRequestException({ message: "No se ha podido subir el contenido.", data: null });

    if (isScheduled && !scheduledAt) {
      throw new BadRequestException({ message: "Debe especificar una fecha de publicación.", data: null });
    }

    const socialNetworkFound = await this.prisma.socialNetworks.findUnique({
      where: { id: args.socialNetworkId, socialNetwork: args.socialNetwork },
      select: { identifier: true, password: true, ownerId: true },
    });

    if (!socialNetworkFound)
      throw new BadRequestException({ message: "No se ha encontrado la red social.", data: null });

    let response: CreateContentResponse = { url: null };

    if (!isScheduled) {
      response = await this.instagramProvider.createContent(args.type, {
        ...args,
        ...socialNetworkFound,
        // Si el contenido es multimedia, se envía la url de la imagen subida a digitalocean en lugar de la url de la red social
        multimediaUrl,
      });
    }

    const contentCreated = await this.prisma.content.create({
      data: {
        caption: args.caption,
        type: args.type,
        socialNetworkId: args.socialNetworkId,
        url: response.url ?? "",
        uploadedAt: new Date(),
        multimediaUrl: multimediaUrl,
        userId: socialNetworkFound.ownerId,
        scheduledAt,
      },
    });

    await this.prisma.socialNetworks.update({
      where: { id: args.socialNetworkId },
      data: { contents: { connect: { id: contentCreated.id } }, lastActivity: new Date() },
    });

    return {
      message: isScheduled ? "El contenido ha sido programado." : "El contenido ha sido realizado.",
      data: { url: response.url },
    };
  }

  async publishScheduledContent(contentId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });

    if (!content) throw new BadRequestException({ message: "No se ha encontrado el contenido.", data: null });

    if (!content.scheduledAt)
      throw new BadRequestException({ message: "Este contenido no está programado.", data: null });

    const socialNetwork = await this.prisma.socialNetworks.findUnique({
      where: { id: content.socialNetworkId },
      select: { identifier: true, password: true },
    });

    if (!socialNetwork) throw new BadRequestException({ message: "No se ha encontrado la red social.", data: null });

    const contentCreated = await this.instagramProvider.createContent(content.type, { ...content, ...socialNetwork });

    if (!contentCreated.url)
      throw new BadRequestException({ message: "No se ha podido publicar el contenido.", data: null });

    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        scheduledAt: null,
        uploadedAt: new Date(),
        url: contentCreated.url,
      },
    });

    return { message: "El contenido ha sido publicado.", data: { url: contentCreated.url } };
  }

  async deleteScheduledContent(contentId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });

    if (!content) throw new BadRequestException({ message: "No se ha encontrado el contenido.", data: null });

    if (!content.scheduledAt)
      throw new BadRequestException({ message: "Este contenido no está programado.", data: null });

    await this.prisma.content.delete({ where: { id: contentId } });

    return { message: "El contenido ha sido eliminado.", data: null };
  }
}
