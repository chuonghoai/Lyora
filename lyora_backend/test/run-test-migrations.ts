import { DatabaseSafetyGuard } from '../src/database/database-safety.guard';
import { TestAppDataSource } from '../src/database/test-data-source';

async function main() {
  console.log('--- EXECUTING MIGRATIONS ON TEST DATABASE ---');
  await TestAppDataSource.initialize();
  await DatabaseSafetyGuard.assertTestDatabase(TestAppDataSource);
  console.log('Database safety guard passed. Running migrations...');

  const migrations = await TestAppDataSource.runMigrations({
    transaction: 'all',
  });
  console.log(`Successfully executed ${migrations.length} migration(s):`);
  for (const m of migrations) {
    console.log(` - ${m.name}`);
  }

  // Verify created tables
  const queryRunner = TestAppDataSource.createQueryRunner();
  const tables = (await queryRunner.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
  )) as Array<{ table_name: string }>;
  console.log(
    'Tables currently in lyora_test_db:',
    tables.map((t) => t.table_name),
  );

  await queryRunner.release();
  await TestAppDataSource.destroy();
  console.log('Migrations completed cleanly.');
}

main().catch((err) => {
  console.error('Migration execution failed:', err);
  process.exit(1);
});
