import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { EnvironmentVariables } from '../config/environment';
import { DatabaseHealthService } from './database-health.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        uri: configService.get('MONGODB_URI', { infer: true }),
        retryAttempts: 3,
        retryDelay: 1000,
        serverSelectionTimeoutMS: 2000,
      }),
    }),
  ],
  providers: [DatabaseHealthService],
  exports: [DatabaseHealthService],
})
export class DatabaseModule {}
