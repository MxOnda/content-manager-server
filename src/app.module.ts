import { Module } from '@nestjs/common';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { EmailerModule } from "./emailer/emailer.module";
import { ContentManagerModule } from "./content-manager/content-manager.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AccessTokenStrategy } from "./auth/strategies/access-token.strategy";
import { SocialNetworksModule } from "./social-networks/social-networks.module";
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    AuthModule,
    EmailerModule,
    ContentManagerModule,
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    SocialNetworksModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, AccessTokenStrategy],
})
export class AppModule {}
