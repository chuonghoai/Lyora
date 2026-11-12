import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Bảo mật HTTP Headers
  app.use(helmet());

  // Cấu hình CORS
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global Prefix (/api)
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Interceptors & Exception Filter
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(reflector),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  logger.log(
    `Lyora Backend đang chạy tại: http://localhost:${port}/${apiPrefix}`,
  );
}

void bootstrap();
