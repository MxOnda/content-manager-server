import { IsEmail, IsString } from "class-validator";

export class RegisterUserDto {
  @IsString()
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  confirmPassword: string;
}
