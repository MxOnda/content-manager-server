import { IsEnum, IsString } from "class-validator";
import { $Enums } from "@prisma/client";

export class RegisterSocialNetworkDto {
  @IsEnum($Enums.SocialNetwork)
  socialNetwork: $Enums.SocialNetwork;

  @IsString()
  identifier: string;

  @IsString()
  password: string;
}
