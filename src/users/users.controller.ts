import { Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateProfileDto } from "./dtos/update-profile.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("/:id/social-networks")
  async getSocialNetworks(@Param("id") userId: string) {
    return this.usersService.retrieveSocialNetworks(userId);
  }

  @Get("/:id/contents")
  async retrieveUserContents(@Param("id") userId: string) {
    return this.usersService.retrieveUserContents(userId);
  }

  @Put("/:id/profile")
  async updateProfile(@Param("id") userId: string, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, body);
  }

  @Post("/:id/profile/profile-picture")
  @UseInterceptors(FileInterceptor("profile-picture"))
  async uploadProfilePicture(@Param("id") userId: string, @UploadedFile() file: Express.Multer.File) {
    const response = await this.usersService.uploadProfilePicture(userId, file);

    return {
      message: "Imagen de perfil subida correctamente.",
      data: response,
    };
  }
}
