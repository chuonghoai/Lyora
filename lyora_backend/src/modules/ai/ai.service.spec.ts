import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { parsePositiveInt } from '../../config/ai.config';
import { AI_PROVIDER } from './ai.constants';
import { AiService } from './ai.service';
import {
  AiProviderError,
  type AiStructuredRequest,
  type IAiProvider,
} from './interfaces/ai-provider.interface';

describe('AiService', () => {
  const sampleRequest: AiStructuredRequest = {
    systemInstruction: 'System test',
    userPrompt: 'User prompt',
    responseSchema: { type: 'object' },
  };

  function createModuleWithProvider(provider: IAiProvider, timeoutMs = 5000) {
    return Test.createTestingModule({
      providers: [
        AiService,
        { provide: AI_PROVIDER, useValue: provider },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              if (key === 'ai.timeoutMs') return timeoutMs;
              return fallback;
            }),
          },
        },
      ],
    }).compile();
  }

  it('throws 503 ServiceUnavailableException when provider is not configured', async () => {
    const generateStructured = jest.fn();
    const mockProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: false,
      generateStructured,
    };

    const moduleRef = await createModuleWithProvider(mockProvider);
    const service = moduleRef.get(AiService);

    expect(service.isAvailable).toBe(false);
    await expect(service.generateStructured(sampleRequest)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it('returns parsed structured output when provider succeeds', async () => {
    const expected = { suggestions: [{ content: 'Gợi ý 1' }] };
    const mockProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: true,
      generateStructured: jest.fn().mockResolvedValue(expected),
    };

    const moduleRef = await createModuleWithProvider(mockProvider);
    const service = moduleRef.get(AiService);

    expect(service.isAvailable).toBe(true);
    await expect(service.generateStructured(sampleRequest)).resolves.toEqual(
      expected,
    );
  });

  it('maps RATE_LIMITED provider error to 429 Too Many Requests', async () => {
    const mockProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: true,
      generateStructured: jest
        .fn()
        .mockRejectedValue(
          new AiProviderError('RATE_LIMITED', '429 Resource exhausted'),
        ),
    };

    const moduleRef = await createModuleWithProvider(mockProvider);
    const service = moduleRef.get(AiService);

    try {
      await service.generateStructured(sampleRequest);
      fail('Expected HttpException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('maps TIMEOUT provider error and signal abort to 502 BadGatewayException', async () => {
    const timeoutProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: true,
      generateStructured: jest
        .fn()
        .mockRejectedValue(new AiProviderError('TIMEOUT', 'Timed out')),
    };

    const module1 = await createModuleWithProvider(timeoutProvider);
    await expect(
      module1.get(AiService).generateStructured(sampleRequest),
    ).rejects.toThrow(BadGatewayException);

    const hangingProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: true,
      generateStructured: jest.fn(
        (_req, signal) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => {
              reject(new Error('Aborted'));
            });
          }),
      ),
    };

    const module2 = await createModuleWithProvider(hangingProvider, 20);
    await expect(
      module2.get(AiService).generateStructured(sampleRequest),
    ).rejects.toThrow(BadGatewayException);
  });

  it('maps INVALID_RESPONSE provider error to 502 BadGatewayException', async () => {
    const mockProvider: IAiProvider = {
      providerName: 'gemini',
      modelName: 'gemini-3.5-flash-lite',
      isConfigured: true,
      generateStructured: jest
        .fn()
        .mockRejectedValue(
          new AiProviderError('INVALID_RESPONSE', 'Malformed JSON'),
        ),
    };

    const moduleRef = await createModuleWithProvider(mockProvider);
    await expect(
      moduleRef.get(AiService).generateStructured(sampleRequest),
    ).rejects.toThrow(BadGatewayException);
  });

  it('parsePositiveInt falls back on empty, NaN, zero, or negative env values', () => {
    expect(parsePositiveInt(undefined, 20000)).toBe(20000);
    expect(parsePositiveInt('', 20000)).toBe(20000);
    expect(parsePositiveInt('   ', 2048)).toBe(2048);
    expect(parsePositiveInt('abc', 30)).toBe(30);
    expect(parsePositiveInt('0', 30)).toBe(30);
    expect(parsePositiveInt('-5', 30)).toBe(30);
    expect(parsePositiveInt('15000', 20000)).toBe(15000);
  });
});
