import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { PrismaService } from "src/common/prisma.service";
import { SocialNetworksService } from "src/social-networks/social-networks.service";
import { InstagramProvider } from "src/content-manager/providers/instagram.provider";
import { DigitaloceanSpacesService } from "src/content-manager/digitalocean-spaces.service";

@Module({
  providers: [UsersService, SocialNetworksService, PrismaService, InstagramProvider, DigitaloceanSpacesService],
  controllers: [UsersController],
})
export class UsersModule {}
