import { Body, Controller, Delete, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ContentManagerService } from "./content-manager.service";

import * as Dtos from "./dtos";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("content-manager")
export class ContentManagerController {
  constructor(private readonly contentManagerService: ContentManagerService) {}

  @Post("/publish")
  @UseInterceptors(FileInterceptor("fileContent"))
  async publish(@UploadedFile() file: Express.Multer.File, @Body() body: Dtos.PublishDto) {
    return await this.contentManagerService.publish(body, file);
  }

  @Post("/publish/content/:id/scheduled")
  async publicScheduledContent(@Param("id") id: string) {
    return await this.contentManagerService.publishScheduledContent(id);
  }

  @Delete("/delete/content/:id/scheduled")
  async deleteScheduledContent(@Param("id") id: string) {
    return await this.contentManagerService.deleteScheduledContent(id);
  }
}
