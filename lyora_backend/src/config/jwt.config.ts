import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret:
    process.env.JWT_SECRET ??
    'lyora_super_secret_jwt_key_replace_in_production_2026',
  accessExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    process.env.JWT_SECRET ??
    'lyora_super_secret_refresh_key_replace_in_production_2026',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
}));
