import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { parsePostgresConnectionConfig } from '../src/database/postgres-connection.util';
import { User } from '../src/modules/users/entities/user.entity';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Danh sách toàn bộ các Entity trong hệ sinh thái Lyora Backend
 */
export const SEED_ENTITIES = [User];

/**
 * Kiểm tra an toàn môi trường trước khi thực thi các thao tác can thiệp dữ liệu Database
 */
export function assertSafeEnvironment(): void {
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    throw new Error(
      `[SECURITY ALERT] KHÔNG THỂ THỰC HIỆN SEED/RESET TRÊN MÔI TRƯỜNG PRODUCTION! (NODE_ENV=${process.env.NODE_ENV})`,
    );
  }

  const dbUrl = process.env.DATABASE_URL ?? '';
  const dangerousPatterns = [
    'prod',
    'production',
    'rds.amazonaws.com',
    'supabase.co',
    'elephantsql.com',
  ];

  for (const pattern of dangerousPatterns) {
    if (
      dbUrl.toLowerCase().includes(pattern) &&
      !process.env.ALLOW_DANGEROUS_DB_OP
    ) {
      throw new Error(
        `[SECURITY ALERT] DATABASE_URL chứa từ khóa nguy cơ thuộc môi trường thật/remote (${pattern}). Hủy thao tác để bảo vệ an toàn dữ liệu!`,
      );
    }
  }
}

/**
 * Khởi tạo TypeORM DataSource dành riêng cho Seed & Script runner
 */
export function createSeedDataSource(options?: {
  synchronize?: boolean;
}): DataSource {
  const rawUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/lyora_db';
  const { url, ssl } = parsePostgresConnectionConfig(rawUrl);
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
  const isDevEnv = nodeEnv === 'dev' || nodeEnv === 'development';

  return new DataSource({
    type: 'postgres',
    url,
    ssl,
    entities: SEED_ENTITIES,
    synchronize: options?.synchronize ?? isDevEnv,
    logging: false,
    extra: {
      connectionTimeoutMillis: 20000,
    },
  });
}
