import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostModerationFields1732000006000 implements MigrationInterface {
  name = 'AddPostModerationFields1732000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'posts_moderationstatus_enum') THEN
          CREATE TYPE "posts_moderationstatus_enum" AS ENUM ('ACTIVE', 'HIDDEN');
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
            ADD COLUMN IF NOT EXISTS "moderationStatus" "posts_moderationstatus_enum" NOT NULL DEFAULT 'ACTIVE',
            ADD COLUMN IF NOT EXISTS "moderationReason" VARCHAR(500) NULL,
            ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMPTZ NULL,
            ADD COLUMN IF NOT EXISTS "moderatedById" UUID NULL;

          CREATE INDEX IF NOT EXISTS "IDX_posts_moderationStatus"
            ON "posts" ("moderationStatus");
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
          DROP INDEX IF EXISTS "IDX_posts_moderationStatus";
          ALTER TABLE "posts"
            DROP COLUMN IF EXISTS "moderatedById",
            DROP COLUMN IF EXISTS "moderatedAt",
            DROP COLUMN IF EXISTS "moderationReason",
            DROP COLUMN IF EXISTS "moderationStatus";
        END IF;
      END
      $$;
    `);
  }
}
