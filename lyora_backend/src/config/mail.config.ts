import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT ?? '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS?.replace(/^["']|["']$/g, '') ?? '',
  from: process.env.SMTP_FROM ?? 'Lyora <no-reply@lyora.com>',
}));
