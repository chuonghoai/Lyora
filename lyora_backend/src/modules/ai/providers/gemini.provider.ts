import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class GeminiProvider implements IAiProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;
  private readonly defaultMaxOutputTokens: number;
  private readonly client: GoogleGenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.apiKey', '').trim();
    this.modelName = this.configService.get<string>(
      'ai.model',
      'gemini-3.5-flash-lite',
    );
    this.defaultMaxOutputTokens = this.configService.get<number>(
      'ai.maxOutputTokens',
      1024,
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

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: request.userPrompt,
        config: {
          systemInstruction: request.systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: request.responseSchema,
          maxOutputTokens:
            request.maxOutputTokens ?? this.defaultMaxOutputTokens,
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
        throw new AiProviderError(
          'INVALID_RESPONSE',
          'Invalid JSON payload returned from Gemini',
        );
      }
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }

      const info = extractUpstreamErrorInfo(error);
      if (signal?.aborted || info.name === 'AbortError') {
        throw new AiProviderError(
          'TIMEOUT',
          'Gemini request aborted/timed out',
        );
      }

      if (
        info.status === 429 ||
        info.code === 429 ||
        info.message.includes('429') ||
        info.message.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new AiProviderError(
          'RATE_LIMITED',
          'Gemini upstream rate limit reached',
        );
      }

      throw new AiProviderError(
        'UPSTREAM_ERROR',
        info.message || 'Gemini request failed',
      );
    }
  }
}
