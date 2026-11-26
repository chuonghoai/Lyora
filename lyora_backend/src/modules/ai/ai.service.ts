import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai.constants';
import {
  AiProviderError,
  type AiStructuredRequest,
  type IAiProvider,
} from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: IAiProvider,
    private readonly configService: ConfigService,
  ) {}

  get isAvailable(): boolean {
    return this.provider.isConfigured;
  }

  async generateStructured<T>(request: AiStructuredRequest): Promise<T> {
    if (!this.provider.isConfigured) {
      throw new ServiceUnavailableException(
        'Tính năng gợi ý AI hiện chưa khả dụng',
      );
    }

    const configuredTimeoutMs = this.configService.get<number>(
      'ai.timeoutMs',
      20000,
    );
    const timeoutMs =
      request.mediaParts && request.mediaParts.length > 0
        ? Math.max(configuredTimeoutMs, 45000)
        : configuredTimeoutMs;
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const result = await this.provider.generateStructured<T>(
        request,
        abortController.signal,
      );
      this.logger.log(
        `AI request succeeded: provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${Date.now() - startedAt}`,
      );
      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof AiProviderError) {
        if (error.code === 'RATE_LIMITED') {
          this.logger.warn(
            `AI request rate-limited: provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${durationMs}`,
          );
          throw new HttpException(
            'Hệ thống AI đang quá tải, vui lòng thử lại sau.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (error.code === 'TIMEOUT' || abortController.signal.aborted) {
          this.logger.warn(
            `AI request timed out: provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${durationMs}`,
          );
          throw new BadGatewayException(
            'Yêu cầu tạo gợi ý bị quá thời gian, vui lòng thử lại.',
          );
        }

        this.logger.warn(
          `AI provider error (${error.code}): provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${durationMs}`,
        );
        throw new BadGatewayException(
          'Không thể tạo gợi ý lúc này, vui lòng thử lại.',
        );
      }

      if (abortController.signal.aborted) {
        this.logger.warn(
          `AI request aborted on timeout: provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${durationMs}`,
        );
        throw new BadGatewayException(
          'Yêu cầu tạo gợi ý bị quá thời gian, vui lòng thử lại.',
        );
      }

      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.warn(
        `AI request failed (${errorName}): provider=${this.provider.providerName} model=${this.provider.modelName} durationMs=${durationMs}`,
      );
      throw new BadGatewayException(
        'Không thể tạo gợi ý lúc này, vui lòng thử lại.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
