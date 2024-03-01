import { Injectable } from "@nestjs/common";

import { get } from "request-promise";

import { IgApiClient } from "instagram-private-api";
import { $Enums } from "@prisma/client";

// @ts-ignore
import * as Cryptr from "cryptr";
import { ConfigService } from "@nestjs/config";

export interface SocialNetworkProfile {
  fullname: string;
  avatar: string;
  username: string;
  bio: string;
  email: string;
}

export interface CreateContentArgs {
  identifier: string;
  password: string;
  caption: string;
  multimediaUrl: string;
}

export interface CreateContentResponse {
  url: string | null;
}

@Injectable()
export class InstagramProvider {
  // Creamos una area para trabajar (variable privada o atributo privado)
  private ig: IgApiClient;

  // Constructor de la clase
  constructor(private readonly configService: ConfigService) {
    // Instanciamos la clase IgApiClient
    this.ig = new IgApiClient();
  }

  async validateCredentials(identifier: string, password: string): Promise<boolean> {
    try {
      this.ig.state.generateDevice(identifier);

      await this.ig.account.login(identifier, password);

      return true;
    } catch (err) {
      console.log(err);

      return false;
    }
  }

  async createContent(type: $Enums.ContentType, args: CreateContentArgs): Promise<CreateContentResponse> {
    const cryptr = new Cryptr(this.configService.get<string>("CRYPTO_SECRET")!);

    const desencryptedPassword = cryptr.decrypt(args.password);

    switch (type) {
      case $Enums.ContentType.Post:
        return await this.makeAPost({ ...args, password: desencryptedPassword });
      case $Enums.ContentType.Story:
        return await this.makeAStory({ ...args, password: desencryptedPassword });
      default:
        return { url: null };
    }
  }

  async getProfile(identifier: string, password: string): Promise<SocialNetworkProfile | null> {
    const cryptr = new Cryptr(this.configService.get<string>("CRYPTO_SECRET")!);

    try {
      const desencryptedPassword = cryptr.decrypt(password);

      this.ig.state.generateDevice(identifier);
      await this.ig.account.login(identifier, desencryptedPassword);

      const user = await this.ig.account.currentUser();

      console.log(JSON.stringify(user, null, 2));

      return {
        avatar: user.profile_pic_url,
        bio: user.biography,
        fullname: user.full_name,
        username: user.username,
        email: user.email,
      };
    } catch (err) {
      return null;
    }
  }

  private async makeAPost({ identifier, password, caption, multimediaUrl }: CreateContentArgs) {
    try {
      this.ig.state.generateDevice(identifier);

      await this.ig.account.login(identifier, password);

      const fileBuffer = await get(multimediaUrl, { encoding: null });

      const response = await this.ig.publish.photo({ file: fileBuffer, caption: caption });

      const url = `https://www.instagram.com/p/${response.media.code}`;

      return { url };
    } catch (err) {
      return { url: null };
    }
  }

  private async makeAStory({ identifier, password, caption, multimediaUrl }: CreateContentArgs) {
    try {
      this.ig.state.generateDevice(identifier);

      await this.ig.account.login(identifier, password);

      const fileBuffer = await get(multimediaUrl, { encoding: null });

      const response = await this.ig.publish.story({ file: fileBuffer, caption: caption });

      const url = `https://www.instagram.com/stories/${response.media.user.username}`;

      return { url };
    } catch (err) {
      return { url: null };
    }
  }
}
