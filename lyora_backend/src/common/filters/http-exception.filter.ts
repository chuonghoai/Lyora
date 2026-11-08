import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
    let errorName = 'InternalServerError';

    if (exception instanceof ThrottlerException) {
      statusCode = HttpStatus.TOO_MANY_REQUESTS;
      message =
        'Hệ thống nhận thấy quá nhiều yêu cầu từ bạn. Vui lòng thử lại sau giây lát.';
      errorName = 'TooManyRequests';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorName = exception.name;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resObj.message) && resObj.message.length > 0) {
          message = String(resObj.message[0]);
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
        if (typeof resObj.error === 'string') {
          errorName = resObj.error;
        }
      }
    } else if (exception instanceof Error) {
      const isDev =
        process.env.NODE_ENV === 'dev' ||
        process.env.NODE_ENV === 'development';
      if (isDev) {
        message = exception.message;
      }
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
