import { IsString, MinLength, MaxLength } from "class-validator";

export class ResetPasswordChangeDto {
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  newPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  confirmNewPassword: string;
}
