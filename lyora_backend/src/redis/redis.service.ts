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

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('redis.url');
    const redisHost = this.configService.get<string>('redis.host');

    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });
    } else if (redisHost) {
      this.client = new Redis({
        host: redisHost,
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password'),
        lazyConnect: true,
        maxRetriesPerRequest: 2,
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
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
    this.memoryStore.clear();
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      return this.client.get(key);
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
    if (this.client && this.client.status === 'ready') {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      return;
    }

    const expiresAt =
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      await this.client.del(key);
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
  }

  async getSession(userId: string, sessionId: string): Promise<string | null> {
    return this.get(REDIS_KEYS.userSession(userId, sessionId));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.del(REDIS_KEYS.userSession(userId, sessionId));
  }

  async setOtp(
    action: string,
    identifier: string,
    otp: string,
    ttlSeconds: number = REDIS_TTL.OTP_SECONDS,
  ): Promise<void> {
    await this.set(REDIS_KEYS.otp(action, identifier), otp, ttlSeconds);
    await this.set(
      REDIS_KEYS.otpCooldown(action, identifier),
      '1',
      REDIS_TTL.OTP_COOLDOWN_SECONDS,
    );
  }

  async isOtpInCooldown(action: string, identifier: string): Promise<boolean> {
    const val = await this.get(REDIS_KEYS.otpCooldown(action, identifier));
    return val !== null;
  }
}
