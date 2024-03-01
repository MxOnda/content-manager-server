import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from "src/common/prisma.service";
import { EmailerModule } from "src/emailer/emailer.module";

@Module({
  providers: [AuthService, PrismaService],
  imports: [EmailerModule],
  controllers: [AuthController],
})
export class AuthModule {}
