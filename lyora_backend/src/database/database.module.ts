import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('database.url');
        const isSsl =
          dbUrl?.includes('sslmode=require') ||
          dbUrl?.includes('aivencloud.com');

        const cleanUrl = dbUrl
          ?.replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
          .replace(/[?&]$/, '');

        return {
          type: 'postgres',
          url: cleanUrl,
          ssl: isSsl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: configService.get<boolean>(
            'database.synchronize',
            false,
          ),
          retryAttempts: 2,
          retryDelay: 1500,
          extra: {
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            connectionTimeoutMillis: 20000,
            idleTimeoutMillis: 300000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
