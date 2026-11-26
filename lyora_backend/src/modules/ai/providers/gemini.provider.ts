import {
  FinishReason,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProviderError,
  type AiStructuredRequest,
  type IAiProvider,
} from '../interfaces/ai-provider.interface';

interface UpstreamErrorInfo {
  name: string;
  message: string;
  status?: number;
  code?: number | string;
}

const TRANSIENT_RETRY_DELAY_MS = 400;

function extractUpstreamErrorInfo(error: unknown): UpstreamErrorInfo {
  if (error instanceof Error) {
    const record = error as unknown as Record<string, unknown>;
    return {
      name: error.name,
      message: error.message,
      status: typeof record.status === 'number' ? record.status : undefined,
      code:
        typeof record.code === 'number' || typeof record.code === 'string'
          ? record.code
          : undefined,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record.name === 'string' ? record.name : 'UnknownError',
      message: typeof record.message === 'string' ? record.message : '',
      status: typeof record.status === 'number' ? record.status : undefined,
      code:
        typeof record.code === 'number' || typeof record.code === 'string'
          ? record.code
          : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : '',
  };
}

function isAbortError(info: UpstreamErrorInfo, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || info.name === 'AbortError';
}

function isRateLimitedError(info: UpstreamErrorInfo): boolean {
  return (
    info.status === 429 ||
    info.code === 429 ||
    info.message.includes('429') ||
    info.message.includes('RESOURCE_EXHAUSTED')
  );
}

function isTransientUpstreamError(info: UpstreamErrorInfo): boolean {
  return (
    info.status === 503 ||
    info.status === 500 ||
    info.status === 504 ||
    info.code === 503 ||
    info.message.includes('503') ||
    info.message.includes('UNAVAILABLE') ||
    info.message.includes('high demand')
  );
}

function delayWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      new AiProviderError('TIMEOUT', 'Gemini request aborted/timed out'),
    );
  }

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(
        new AiProviderError('TIMEOUT', 'Gemini request aborted/timed out'),
      );
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  readonly providerName = 'gemini';
  readonly modelName: string;
  readonly fallbackModelName: string;
  private readonly defaultMaxOutputTokens: number;
  private readonly client: GoogleGenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.apiKey', '').trim();
    this.modelName =
      this.configService
        .get<string>('ai.model', 'gemini-3.5-flash-lite')
        .trim() || 'gemini-3.5-flash-lite';
    this.fallbackModelName = this.configService
      .get<string>('ai.fallbackModel', 'gemma-4-31b-it')
      .trim();
    this.defaultMaxOutputTokens = this.configService.get<number>(
      'ai.maxOutputTokens',
      2048,
    );
    this.client = apiKey.length > 0 ? new GoogleGenAI({ apiKey }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async generateStructured<T>(
    request: AiStructuredRequest,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!this.client) {
      throw new AiProviderError(
        'UPSTREAM_ERROR',
        'Gemini client is not configured',
      );
    }

    const canUseFallback =
      this.fallbackModelName.length > 0 &&
      this.fallbackModelName !== this.modelName;

    try {
      return await this.requestWithTransientRetry<T>(
        this.modelName,
        request,
        signal,
      );
    } catch (error) {
      if (
        !canUseFallback ||
        signal?.aborted ||
        !this.shouldFallbackOnError(error)
      ) {
        throw this.normalizeError(error, signal);
      }

      const reason =
        error instanceof AiProviderError
          ? error.code
          : (extractUpstreamErrorInfo(error).status ?? 'UNAVAILABLE');
      this.logger.warn(
        `Primary model (${this.modelName}) unavailable (${reason}), falling back to ${this.fallbackModelName}`,
      );

      try {
        return await this.invokeModel<T>(
          this.fallbackModelName,
          request,
          signal,
        );
      } catch (fallbackError) {
        throw this.normalizeError(fallbackError, signal);
      }
    }
  }

  private async requestWithTransientRetry<T>(
    model: string,
    request: AiStructuredRequest,
    signal?: AbortSignal,
  ): Promise<T> {
    try {
      return await this.invokeModel<T>(model, request, signal);
    } catch (firstError) {
      const info = extractUpstreamErrorInfo(firstError);
      if (
        firstError instanceof AiProviderError ||
        isAbortError(info, signal) ||
        !isTransientUpstreamError(info)
      ) {
        throw firstError;
      }

      this.logger.warn(
        `Transient upstream error on ${model} (status=${info.status ?? 'unknown'}), retrying once`,
      );
      await delayWithAbort(TRANSIENT_RETRY_DELAY_MS, signal);
      return await this.invokeModel<T>(model, request, signal);
    }
  }

  private async invokeModel<T>(
    model: string,
    request: AiStructuredRequest,
    signal?: AbortSignal,
  ): Promise<T> {
    const activeMediaParts = this.filterMediaPartsForModel(
      model,
      request.mediaParts,
    );
    const contents =
      activeMediaParts.length > 0
        ? [
            {
              role: 'user',
              parts: [
                { text: request.userPrompt },
                ...activeMediaParts.map((part) => ({
                  inlineData: {
                    mimeType: part.mimeType,
                    data: part.data.toString('base64'),
                  },
                })),
              ],
            },
          ]
        : request.userPrompt;

    const response = await this.client!.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: request.systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema: request.responseSchema,
        maxOutputTokens: request.maxOutputTokens ?? this.defaultMaxOutputTokens,
        temperature: request.temperature ?? 0.7,
        abortSignal: signal,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new AiProviderError('INVALID_RESPONSE', 'Empty AI response');
    }

    try {
      return JSON.parse(rawText) as T;
    } catch {
      const finishReason = response.candidates?.[0]?.finishReason;
      const detail =
        finishReason === FinishReason.MAX_TOKENS
          ? 'Truncated JSON payload (MAX_TOKENS)'
          : 'Invalid JSON payload returned from Gemini';
      throw new AiProviderError('INVALID_RESPONSE', detail);
    }
  }

  private filterMediaPartsForModel(
    model: string,
    mediaParts?: AiStructuredRequest['mediaParts'],
  ): NonNullable<AiStructuredRequest['mediaParts']> {
    if (!mediaParts || mediaParts.length === 0) {
      return [];
    }

    if (model.toLowerCase().includes('gemma')) {
      const imageOnly = mediaParts.filter((part) =>
        part.mimeType.startsWith('image/'),
      );
      if (imageOnly.length < mediaParts.length) {
        this.logger.warn(
          `Model ${model} only supports image multimodal input; omitted ${mediaParts.length - imageOnly.length} non-image media part(s) during fallback`,
        );
      }
      return imageOnly;
    }

    return mediaParts;
  }

  private shouldFallbackOnError(error: unknown): boolean {
    if (error instanceof AiProviderError) {
      return error.code === 'RATE_LIMITED';
    }
    const info = extractUpstreamErrorInfo(error);
    return isTransientUpstreamError(info) || isRateLimitedError(info);
  }

  private normalizeError(
    error: unknown,
    signal?: AbortSignal,
  ): AiProviderError {
    if (error instanceof AiProviderError) {
      return error;
    }

    const info = extractUpstreamErrorInfo(error);
    if (isAbortError(info, signal)) {
      return new AiProviderError('TIMEOUT', 'Gemini request aborted/timed out');
    }

    if (isRateLimitedError(info)) {
      return new AiProviderError(
        'RATE_LIMITED',
        'Gemini upstream rate limit reached',
      );
    }

    return new AiProviderError(
      'UPSTREAM_ERROR',
      info.message || 'Gemini request failed',
    );
  }
}
