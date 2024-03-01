import { Body, Controller, Post, Put, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto, SigninUserDto } from "./dtos";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { AccessTokenGuard } from "./guard/access-token.guard";
import { Request } from "express";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { ResetPasswordChangeDto } from "./dtos/reset-password-change.dto";
import { DeactivateAccountDto } from "./dtos/deactivate-account.dto";
import { ReactivateAccountDto } from "./dtos/reactivate-account.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  @Post("/signin")
  signin(@Body() body: SigninUserDto) {
    return this.authService.signin(body);
  }

  @Post("/confirm-email")
  confirmEmail(@Query("token") token: string) {
    return this.authService.confirmEmail({ token });
  }

  @UseGuards(AccessTokenGuard)
  @Post("/change-password")
  changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, body);
  }

  @Post("/reset-password")
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Put("/reset-password/change")
  resetPasswordChange(@Query("token") token: string, @Body() body: ResetPasswordChangeDto) {
    return this.authService.resetPasswordChange(token, body);
  }

  @UseGuards(AccessTokenGuard)
  @Post("/deactivate-account")
  deactivateAccount(@Req() req: Request, @Body() body: DeactivateAccountDto) {
    return this.authService.deactivateAccount(req.user.id, body);
  }

  @UseGuards(AccessTokenGuard)
  @Post("/reactivate-account")
  reactivateAccount(@Req() req: Request, @Body() body: ReactivateAccountDto) {
    if (req.user.role !== "ADMIN") {
      throw new UnauthorizedException({ message: "No tienes permisos para realizar esta acción." });
    }

    return this.authService.reactivateAccount(body);
  }
}
