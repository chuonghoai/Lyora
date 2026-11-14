import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { parsePostgresConnectionConfig } from './postgres-connection.util';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl =
          configService.get<string>('database.url') ??
          'postgresql://postgres:postgres@localhost:5432/lyora_db';
        const { url: cleanUrl, ssl } = parsePostgresConnectionConfig(dbUrl);

        return {
          type: 'postgres',
          url: cleanUrl,
          ssl,
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
