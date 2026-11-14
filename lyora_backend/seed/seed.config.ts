import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';

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
export function createSeedDataSource(): DataSource {
  const dbUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/lyora_db';

  return new DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: SEED_ENTITIES,
    synchronize: false,
    logging: false,
  });
}
