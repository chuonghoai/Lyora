import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_KEYS, REDIS_TTL } from '../common/constants/redis-keys.constant';

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryStore = new Map<string, MemoryEntry>();
  private readonly memorySessionSets = new Map<string, Set<string>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('redis.url');
    const redisHost = this.configService.get<string>('redis.host');

    const baseOptions = {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      commandTimeout: 8000,
      keepAlive: 15000,
      enableOfflineQueue: false,
    };

    if (redisUrl) {
      const isTls = redisUrl.startsWith('rediss://');
      this.client = new Redis(redisUrl, {
        ...baseOptions,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
      });
    } else if (redisHost) {
      this.client = new Redis({
        ...baseOptions,
        host: redisHost,
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password'),
      });
    }

    if (this.client) {
      this.client.on('error', (err: Error) => {
        this.logger.warn(
          `Redis connection warning (fallback to in-memory store): ${err.message}`,
        );
      });
    } else {
      this.logger.log(
        'REDIS_URL chưa được cấu hình — Sử dụng In-Memory TTL Store cho phiên làm việc cục bộ',
      );
    }

    this.cleanupTimer = setInterval(() => {
      this.pruneExpiredMemoryEntries();
    }, 60_000);
    this.cleanupTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
    this.memoryStore.clear();
    this.memorySessionSets.clear();
  }

  private pruneExpiredMemoryEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }

  private async execClient<T>(
    op: string,
    fn: (client: Redis) => Promise<T>,
  ): Promise<{ ok: true; value: T } | { ok: false }> {
    if (!this.client || this.client.status !== 'ready') {
      return { ok: false };
    }
    try {
      return { ok: true, value: await fn(this.client) };
    } catch (err) {
      this.logger.warn(
        `Redis ${op} failed, falling back to memory store: ${(err as Error).message}`,
      );
      return { ok: false };
    }
  }

  async get(key: string): Promise<string | null> {
    const res = await this.execClient('GET', (client) => client.get(key));
    if (res.ok) {
      return res.value;
    }
    const entry = this.memoryStore.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const res = await this.execClient('SET', (client) =>
      ttlSeconds && ttlSeconds > 0
        ? client.set(key, value, 'EX', ttlSeconds)
        : client.set(key, value),
    );
    if (res.ok) {
      return;
    }

    const expiresAt =
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    const res = await this.execClient('DEL', (client) => client.del(key));
    if (res.ok) {
      return;
    }
    this.memoryStore.delete(key);
  }

  async blacklistToken(
    token: string,
    ttlSeconds: number = REDIS_TTL.DEFAULT_ACCESS_TOKEN_SECONDS,
  ): Promise<void> {
    await this.set(
      REDIS_KEYS.tokenBlacklist(token),
      'revoked',
      Math.max(1, ttlSeconds),
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const val = await this.get(REDIS_KEYS.tokenBlacklist(token));
    return val !== null;
  }

  async saveSession(
    userId: string,
    sessionId: string,
    refreshToken: string,
    ttlSeconds: number = REDIS_TTL.DEFAULT_REFRESH_TOKEN_SECONDS,
  ): Promise<void> {
    await this.set(
      REDIS_KEYS.userSession(userId, sessionId),
      refreshToken,
      ttlSeconds,
    );

    const indexKey = REDIS_KEYS.userSessionIndex(userId);
    const res = await this.execClient('SADD', async (client) => {
      await client.sadd(indexKey, sessionId);
      await client.expire(indexKey, ttlSeconds);
    });
    if (!res.ok) {
      const set = this.memorySessionSets.get(userId) ?? new Set<string>();
      set.add(sessionId);
      this.memorySessionSets.set(userId, set);
    }
  }

  async getSession(userId: string, sessionId: string): Promise<string | null> {
    return this.get(REDIS_KEYS.userSession(userId, sessionId));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.del(REDIS_KEYS.userSession(userId, sessionId));

    const indexKey = REDIS_KEYS.userSessionIndex(userId);
    const res = await this.execClient('SREM', (client) =>
      client.srem(indexKey, sessionId),
    );
    if (!res.ok) {
      this.memorySessionSets.get(userId)?.delete(sessionId);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const indexKey = REDIS_KEYS.userSessionIndex(userId);
    const res = await this.execClient('SMEMBERS', (client) =>
      client.smembers(indexKey),
    );

    const redisIds = res.ok ? res.value : [];
    const memoryIds = Array.from(this.memorySessionSets.get(userId) ?? []);
    const allSessionIds = new Set([...redisIds, ...memoryIds]);

    await Promise.all([
      ...Array.from(allSessionIds).map((sessionId) =>
        this.del(REDIS_KEYS.userSession(userId, sessionId)),
      ),
      this.del(indexKey),
    ]);
    this.memorySessionSets.delete(userId);
  }

  async setOtp(
    action: string,
    identifier: string,
    otp: string,
    ttlSeconds: number = REDIS_TTL.OTP_SECONDS,
  ): Promise<void> {
    await Promise.all([
      this.set(REDIS_KEYS.otp(action, identifier), otp, ttlSeconds),
      this.del(REDIS_KEYS.otpAttempts(action, identifier)),
      this.set(
        REDIS_KEYS.otpCooldown(action, identifier),
        '1',
        REDIS_TTL.OTP_COOLDOWN_SECONDS,
      ),
    ]);
  }

  async getOtp(action: string, identifier: string): Promise<string | null> {
    return this.get(REDIS_KEYS.otp(action, identifier));
  }

  async delOtp(action: string, identifier: string): Promise<void> {
    await Promise.all([
      this.del(REDIS_KEYS.otp(action, identifier)),
      this.del(REDIS_KEYS.otpAttempts(action, identifier)),
    ]);
  }

  async incrementOtpAttempts(
    action: string,
    identifier: string,
    ttlSeconds: number = REDIS_TTL.OTP_SECONDS,
  ): Promise<number> {
    const key = REDIS_KEYS.otpAttempts(action, identifier);
    const res = await this.execClient('INCR', async (client) => {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSeconds);
      }
      return count;
    });
    if (res.ok) {
      return res.value;
    }

    const now = Date.now();
    const existing = this.memoryStore.get(key);
    const isValid =
      existing !== undefined &&
      (existing.expiresAt === null || now <= existing.expiresAt);
    const nextCount = isValid ? (parseInt(existing.value, 10) || 0) + 1 : 1;
    const expiresAt = isValid ? existing.expiresAt : now + ttlSeconds * 1000;
    this.memoryStore.set(key, { value: String(nextCount), expiresAt });
    return nextCount;
  }

  async delOtpCooldown(action: string, identifier: string): Promise<void> {
    await this.del(REDIS_KEYS.otpCooldown(action, identifier));
  }

  async isOtpInCooldown(action: string, identifier: string): Promise<boolean> {
    const val = await this.get(REDIS_KEYS.otpCooldown(action, identifier));
    return val !== null;
  }

  async setResetToken(
    email: string,
    token: string,
    ttlSeconds: number = REDIS_TTL.RESET_PASSWORD_TOKEN_SECONDS,
  ): Promise<void> {
    await this.set(REDIS_KEYS.resetPasswordToken(email), token, ttlSeconds);
  }

  async getResetToken(email: string): Promise<string | null> {
    return this.get(REDIS_KEYS.resetPasswordToken(email));
  }

  async delResetToken(email: string): Promise<void> {
    await this.del(REDIS_KEYS.resetPasswordToken(email));
  }
}
