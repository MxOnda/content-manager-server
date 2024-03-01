import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { InstagramProvider } from "./providers/instagram.provider";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ScheduledContentManagerService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    private readonly instagramProvider: InstagramProvider,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async resume() {
    this.logger.log("Revisando contenidos programados...");
    const contents = await this.prisma.content.findMany({
      where: { AND: [{ scheduledAt: { lte: new Date() } }, { scheduledAt: { not: null } }] },
      include: { socialNetwork: true },
    });

    if (contents.length === 0) {
      this.logger.log("No hay contenidos programados.");
      return;
    }

    this.logger.log(`Hay ${contents.length} contenidos programados.`);

    const responses: { url: string }[] = [];

    for (const content of contents) {
      this.logger.log(`Creando contenido ${content.id}...`);
      const response = await this.instagramProvider.createContent(content.type, {
        caption: content.caption,
        identifier: content.socialNetwork.identifier,
        multimediaUrl: content.multimediaUrl,
        password: content.socialNetwork.password,
      });

      if (!response.url) return { error: "No se ha podido publicar el contenido." };

      await this.prisma.content.update({
        where: { id: content.id },
        data: { url: response.url, scheduledAt: null, uploadedAt: new Date() },
      });

      responses.push({ url: response.url });

      this.logger.log(`Contenido ${content.id} creado.`);
    }

    this.logger.log(`Hay ${contents.length} contenidos programados.`);
  }
}
