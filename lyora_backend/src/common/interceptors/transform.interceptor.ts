import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { ApiResponseDto, PaginationMetaDto } from '../dto/api-response.dto';

interface PaginatedPayload<T> {
  items: T;
  meta: PaginationMetaDto;
}

function isApiResponseDto<T>(val: unknown): val is ApiResponseDto<T> {
  return (
    typeof val === 'object' &&
    val !== null &&
    'success' in val &&
    'message' in val &&
    'data' in val
  );
}

function isPaginatedPayload<T>(val: unknown): val is PaginatedPayload<T> {
  return (
    typeof val === 'object' && val !== null && 'items' in val && 'meta' in val
  );
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const responseMessage = customMessage ?? 'Thao tác thành công';

    return next.handle().pipe(
      map((data: T): ApiResponseDto<T> => {
        if (isApiResponseDto<T>(data)) {
          return data;
        }

        if (isPaginatedPayload<T>(data)) {
          return new ApiResponseDto<T>(
            true,
            responseMessage,
            data.items,
            data.meta,
          );
        }

        return new ApiResponseDto<T>(true, responseMessage, data);
      }),
    );
  }
}
