export interface PostgresConnectionConfig {
  url: string;
  ssl: { rejectUnauthorized: boolean } | false;
}

/**
 * Chuẩn hóa chuỗi kết nối PostgreSQL và cấu hình SSL cho cả môi trường local và cloud.
 */
export function parsePostgresConnectionConfig(
  dbUrl: string,
): PostgresConnectionConfig {
  const hasDisableSsl = /[?&]sslmode=disable(?:&|$)/i.test(dbUrl);
  const isSsl =
    !hasDisableSsl &&
    (/[?&]sslmode=(?:require|verify-ca|verify-full|prefer|no-verify)(?:&|$)/i.test(
      dbUrl,
    ) ||
      dbUrl.includes('aivencloud.com'));

  const cleanUrl = dbUrl
    .replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '');

  return {
    url: cleanUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  };
}

