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
  const nodeEnv = configService.get<string>('app.nodeEnv', 'dev');
  const isDev = nodeEnv === 'dev' || nodeEnv === 'development';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];
  const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        corsOrigins.includes(origin) ||
        (isDev && localDevOriginPattern.test(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin không được phép bởi CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-idempotency-key',
    ],
  });

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
  logger.log(`Lyora Backend đang chạy tại: http://localhost:${port}`);
}

void bootstrap();
