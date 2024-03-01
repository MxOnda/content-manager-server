import { $Enums } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class PublishDto {
  @IsUUID()
  readonly socialNetworkId: string;

  @IsEnum($Enums.SocialNetwork)
  readonly socialNetwork: $Enums.SocialNetwork;

  @IsEnum($Enums.ContentType)
  readonly type: $Enums.ContentType;

  @IsString()
  readonly caption: string;

  @IsString()
  readonly isScheduled: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;
}
