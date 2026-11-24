import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai.constants';
import { AiService } from './ai.service';
import type { IAiProvider } from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GeminiProvider],
      useFactory: (
        configService: ConfigService,
        geminiProvider: GeminiProvider,
      ): IAiProvider => {
        const provider = (
          configService.get<string>('ai.provider', 'gemini') ?? 'gemini'
        )
          .trim()
          .toLowerCase();

        switch (provider) {
          case 'gemini':
            return geminiProvider;
          default:
            throw new Error(
              `Nhà cung cấp AI không được hỗ trợ (AI_PROVIDER=${provider})`,
            );
        }
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
