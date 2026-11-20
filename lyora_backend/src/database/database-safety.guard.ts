import { DataSource } from 'typeorm';

export class DatabaseSafetyGuard {
  private static readonly ALLOWED_TEST_DATABASES = new Set(['lyora_test_db']);

  /**
   * Asserts that the DataSource or connection target is strictly the confirmed isolated test database (lyora_test_db).
   * Throws an immediate fatal exception if the database name is 'lyora_db' or not in ALLOWED_TEST_DATABASES.
   */
  static async assertTestDatabase(dataSource: DataSource): Promise<void> {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const queryRunner = dataSource.createQueryRunner();
    try {
      const rawResult: unknown = await queryRunner.query(
        'SELECT current_database() as db_name;',
      );
      const rows = Array.isArray(rawResult) ? rawResult : [];
      const firstRow: unknown = rows[0];
      let currentDb = '';

      if (
        typeof firstRow === 'object' &&
        firstRow !== null &&
        'db_name' in firstRow &&
        typeof (firstRow as Record<string, unknown>).db_name === 'string'
      ) {
        currentDb = (firstRow as Record<string, unknown>).db_name as string;
      }

      if (
        !currentDb ||
        currentDb === 'lyora_db' ||
        !this.ALLOWED_TEST_DATABASES.has(currentDb.toLowerCase())
      ) {
        throw new Error(
          `[CRITICAL DATABASE SAFETY VIOLATION] Attempted to run test/destructive operations on database: '${currentDb}'. Target MUST be explicitly confirmed test database ('lyora_test_db') and NEVER 'lyora_db'!`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Static validation of database URL string before establishing connection.
   */
  static validateTestDatabaseUrl(url: string): void {
    const parsed = new URL(
      url.replace('postgresql://', 'http://').replace('postgres://', 'http://'),
    );
    const pathname = parsed.pathname.replace(/^\//, '');

    if (
      pathname === 'lyora_db' ||
      !this.ALLOWED_TEST_DATABASES.has(pathname.toLowerCase())
    ) {
      throw new Error(
        `[CRITICAL DATABASE SAFETY VIOLATION] Connection URL target '${pathname}' is not allowed for testing. Target MUST be explicitly confirmed test database ('lyora_test_db').`,
      );
    }
  }
}
