import { Module } from "@nestjs/common";
import { SocialNetworksService } from "./social-networks.service";
import { SocialNetworksController } from "./social-networks.controller";
import { PrismaService } from "src/common/prisma.service";
import { InstagramProvider } from "src/content-manager/providers/instagram.provider";

@Module({
  providers: [SocialNetworksService, PrismaService, InstagramProvider],
  controllers: [SocialNetworksController],
})
export class SocialNetworksModule {}
