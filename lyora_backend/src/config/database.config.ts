import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/lyora_db',
  synchronize:
    process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development',
}));
