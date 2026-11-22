import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER ?? 'gemini',
  apiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
  model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',
  timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? '20000', 10),
  maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS ?? '1024', 10),
  dailyQuotaPerUser: parseInt(process.env.AI_DAILY_QUOTA_PER_USER ?? '30', 10),
}));
