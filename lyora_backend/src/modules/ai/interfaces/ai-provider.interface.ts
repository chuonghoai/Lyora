export interface AiStructuredRequest {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
}

export type AiProviderErrorCode =
  'RATE_LIMITED' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'UPSTREAM_ERROR';

export class AiProviderError extends Error {
  constructor(
    public readonly code: AiProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export interface IAiProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly isConfigured: boolean;
  generateStructured<T>(
    request: AiStructuredRequest,
    signal?: AbortSignal,
  ): Promise<T>;
}
