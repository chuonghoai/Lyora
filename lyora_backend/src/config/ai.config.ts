import { registerAs } from '@nestjs/config';

export function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default registerAs('ai', () => ({
  provider: (process.env.AI_PROVIDER?.trim() || 'gemini').toLowerCase(),
  apiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
  model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',
  fallbackModel: process.env.GEMINI_FALLBACK_MODEL?.trim() || 'gemma-4-31b-it',
  timeoutMs: parsePositiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 20000),
  maxOutputTokens: parsePositiveInt(process.env.AI_MAX_OUTPUT_TOKENS, 2048),
  dailyQuotaPerUser: parsePositiveInt(process.env.AI_DAILY_QUOTA_PER_USER, 30),
}));
