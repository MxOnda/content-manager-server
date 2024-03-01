import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class ReactivateAccountDto {
  @IsUUID()
  userId: string;
}
