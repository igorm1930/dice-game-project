import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import type { EnvironmentVariables } from '../config/environment';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
          issuer: configService.get('JWT_ISSUER', { infer: true }),
          audience: configService.get('JWT_AUDIENCE', { infer: true }),
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthThrottlerGuard, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
