import { Logger, Module } from "@nestjs/common";
import { ContentManagerService } from "./content-manager.service";
import { ContentManagerController } from "./content-manager.controller";
import { PrismaService } from "src/common/prisma.service";
import { InstagramProvider } from "src/content-manager/providers/instagram.provider";
import { ScheduledContentManagerService } from "./scheduled-content-manager.service";
import { ScheduleModule } from "@nestjs/schedule";
import { DigitaloceanSpacesService } from "./digitalocean-spaces.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    ContentManagerService,
    PrismaService,
    InstagramProvider,
    ScheduledContentManagerService,
    Logger,
    DigitaloceanSpacesService,
  ],
  controllers: [ContentManagerController],
})
export class ContentManagerModule {}
