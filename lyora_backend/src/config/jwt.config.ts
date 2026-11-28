import { registerAs } from '@nestjs/config';

const DEV_ACCESS_SECRET =
  'lyora_super_secret_jwt_key_replace_in_production_2026';
const DEV_REFRESH_SECRET =
  'lyora_super_secret_refresh_key_replace_in_production_2026';

export default registerAs('jwt', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? jwtSecret;

  if (isProduction && !jwtSecret) {
    throw new Error(
      'Biến môi trường JWT_SECRET bắt buộc phải được cấu hình trong môi trường production.',
    );
  }

  return {
    accessSecret: jwtSecret ?? DEV_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    refreshSecret: refreshSecret ?? DEV_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  };
});
