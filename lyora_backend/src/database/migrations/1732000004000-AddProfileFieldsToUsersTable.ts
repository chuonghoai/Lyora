import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToUsersTable1732000004000 implements MigrationInterface {
  name = 'AddProfileFieldsToUsersTable1732000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "coverUrl" VARCHAR(500) NULL,
        ADD COLUMN IF NOT EXISTS "hometown" VARCHAR(120) NULL,
        ADD COLUMN IF NOT EXISTS "workplace" VARCHAR(120) NULL,
        ADD COLUMN IF NOT EXISTS "education" VARCHAR(120) NULL,
        ADD COLUMN IF NOT EXISTS "website" VARCHAR(200) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "website",
        DROP COLUMN IF EXISTS "education",
        DROP COLUMN IF EXISTS "workplace",
        DROP COLUMN IF EXISTS "hometown",
        DROP COLUMN IF EXISTS "coverUrl";
    `);
  }
}
