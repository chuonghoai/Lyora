import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViolationFlagFields1732000007000 implements MigrationInterface {
  name = 'AddViolationFlagFields1732000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN
          ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "avatarViolationReason" VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS "avatarViolationFlaggedAt" TIMESTAMPTZ NULL,
            ADD COLUMN IF NOT EXISTS "avatarViolationFlaggedById" UUID NULL,
            ADD COLUMN IF NOT EXISTS "avatarViolationEvidenceUrl" VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS "coverViolationReason" VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS "coverViolationFlaggedAt" TIMESTAMPTZ NULL,
            ADD COLUMN IF NOT EXISTS "coverViolationFlaggedById" UUID NULL,
            ADD COLUMN IF NOT EXISTS "coverViolationEvidenceUrl" VARCHAR(500) NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'posts'
        ) THEN
          ALTER TABLE "posts"
            ADD COLUMN IF NOT EXISTS "isViolationFlagged" BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS "violationReason" VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS "violationFlaggedAt" TIMESTAMPTZ NULL,
            ADD COLUMN IF NOT EXISTS "violationFlaggedById" UUID NULL;

          CREATE INDEX IF NOT EXISTS "IDX_posts_isViolationFlagged"
            ON "posts" ("isViolationFlagged");
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'posts'
        ) THEN
          DROP INDEX IF EXISTS "IDX_posts_isViolationFlagged";
          ALTER TABLE "posts"
            DROP COLUMN IF EXISTS "violationFlaggedById",
            DROP COLUMN IF EXISTS "violationFlaggedAt",
            DROP COLUMN IF EXISTS "violationReason",
            DROP COLUMN IF EXISTS "isViolationFlagged";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN
          ALTER TABLE "users"
            DROP COLUMN IF EXISTS "coverViolationEvidenceUrl",
            DROP COLUMN IF EXISTS "coverViolationFlaggedById",
            DROP COLUMN IF EXISTS "coverViolationFlaggedAt",
            DROP COLUMN IF EXISTS "coverViolationReason",
            DROP COLUMN IF EXISTS "avatarViolationEvidenceUrl",
            DROP COLUMN IF EXISTS "avatarViolationFlaggedById",
            DROP COLUMN IF EXISTS "avatarViolationFlaggedAt",
            DROP COLUMN IF EXISTS "avatarViolationReason";
        END IF;
      END
      $$;
    `);
  }
}
