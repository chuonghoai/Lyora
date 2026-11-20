import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai.constants';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
