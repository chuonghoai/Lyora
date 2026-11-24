import { ConfigService } from '@nestjs/config';
import {
  AiProviderError,
  type AiStructuredRequest,
} from '../interfaces/ai-provider.interface';
import { GeminiProvider } from './gemini.provider';

const mockGenerateContent = jest.fn<
  Promise<unknown>,
  [Record<string, unknown>]
>();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  FinishReason: {
    MAX_TOKENS: 'MAX_TOKENS',
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

describe('GeminiProvider', () => {
  const sampleRequest: AiStructuredRequest = {
    systemInstruction: 'System prompt',
    userPrompt: 'User prompt',
    responseSchema: { type: 'object' },
  };

  function createProvider(overrides?: Partial<Record<string, unknown>>) {
    const values: Record<string, unknown> = {
      'ai.apiKey': 'test-api-key',
      'ai.model': 'gemini-3.5-flash-lite',
      'ai.fallbackModel': 'gemma-4-31b-it',
      'ai.maxOutputTokens': 2048,
      ...overrides,
    };

    const configService = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key in values ? values[key] : fallback,
      ),
    } as unknown as ConfigService;

    return new GeminiProvider(configService);
  }

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it('retries primary model once on transient 503 and succeeds without fallback', async () => {
    const transientError = Object.assign(
      new Error('This model is currently experiencing high demand'),
      { status: 503 },
    );

    mockGenerateContent
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({
        text: JSON.stringify({ suggestions: [{ content: 'Gợi ý 1' }] }),
      });

    const provider = createProvider();
    const result = await provider.generateStructured<{
      suggestions: Array<{ content: string }>;
    }>(sampleRequest);

    expect(result).toEqual({ suggestions: [{ content: 'Gợi ý 1' }] });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0]?.[0]).toMatchObject({
      model: 'gemini-3.5-flash-lite',
    });
    expect(mockGenerateContent.mock.calls[1]?.[0]).toMatchObject({
      model: 'gemini-3.5-flash-lite',
    });
  });

  it('falls back to gemma-4-31b-it when primary model keeps returning 503 UNAVAILABLE', async () => {
    const unavailableError = Object.assign(
      new Error('503 UNAVAILABLE high demand'),
      { status: 503 },
    );

    mockGenerateContent
      .mockRejectedValueOnce(unavailableError)
      .mockRejectedValueOnce(unavailableError)
      .mockResolvedValueOnce({
        text: JSON.stringify({ suggestions: [{ content: 'Từ Gemma 4 31B' }] }),
      });

    const provider = createProvider();
    const result = await provider.generateStructured<{
      suggestions: Array<{ content: string }>;
    }>(sampleRequest);

    expect(result).toEqual({ suggestions: [{ content: 'Từ Gemma 4 31B' }] });
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(mockGenerateContent.mock.calls[2]?.[0]).toMatchObject({
      model: 'gemma-4-31b-it',
    });
  });

  it('falls back to gemma-4-31b-it immediately on 429 rate limit without retrying primary', async () => {
    const rateLimitError = Object.assign(new Error('429 RESOURCE_EXHAUSTED'), {
      status: 429,
    });

    mockGenerateContent
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        text: JSON.stringify({ suggestions: [{ content: 'Fallback 429 OK' }] }),
      });

    const provider = createProvider();
    const result = await provider.generateStructured<{
      suggestions: Array<{ content: string }>;
    }>(sampleRequest);

    expect(result).toEqual({ suggestions: [{ content: 'Fallback 429 OK' }] });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0]?.[0]).toMatchObject({
      model: 'gemini-3.5-flash-lite',
    });
    expect(mockGenerateContent.mock.calls[1]?.[0]).toMatchObject({
      model: 'gemma-4-31b-it',
    });
  });

  it('throws INVALID_RESPONSE with MAX_TOKENS detail when JSON payload is truncated', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"suggestions":[{"content":"Bị cắt cụt',
      candidates: [{ finishReason: 'MAX_TOKENS' }],
    });

    const provider = createProvider();

    await expect(provider.generateStructured(sampleRequest)).rejects.toThrow(
      new AiProviderError(
        'INVALID_RESPONSE',
        'Truncated JSON payload (MAX_TOKENS)',
      ),
    );
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('throws TIMEOUT without retrying or falling back when signal is aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockGenerateContent.mockRejectedValueOnce(abortError);

    const provider = createProvider();

    await expect(
      provider.generateStructured(sampleRequest, abortController.signal),
    ).rejects.toMatchObject({
      name: 'AiProviderError',
      code: 'TIMEOUT',
    });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
