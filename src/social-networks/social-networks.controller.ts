import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SocialNetworksService } from "./social-networks.service";
import { RegisterSocialNetworkDto } from "./dtos/register-social-network";
import { ChangePasswordDto } from "./dtos/change-password";
import { AccessTokenGuard } from "src/auth/guard/access-token.guard";
import { Request } from "express";

@Controller("social-networks")
export class SocialNetworksController {
  constructor(private readonly socialNetworksService: SocialNetworksService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  async register(@Req() req: Request, @Body() body: RegisterSocialNetworkDto) {
    return await this.socialNetworksService.register(req.user.id, body);
  }

  @Get("users/:userId")
  async findAll(@Param("userId") userId: string) {
    return await this.socialNetworksService.findByUserId(userId);
  }

  @Get(":id/profile")
  async retrieveProfile(@Param("id") id: string) {
    return await this.socialNetworksService.retrieveProfile(id);
  }

  @Get(":id/content")
  async retrieveContent(@Param("id") socialNetworkId: string) {
    return await this.socialNetworksService.retrieveContent(socialNetworkId);
  }

  @Post(":id/change-password")
  async changePassword(@Req() req: Request, @Param("id") id: string, @Body() body: ChangePasswordDto) {
    return await this.socialNetworksService.changePassword(req.user.id, id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return await this.socialNetworksService.remove(id);
  }
}
