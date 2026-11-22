import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationsAndMembersTable1732000002000 implements MigrationInterface {
  name = 'CreateConversationsAndMembersTable1732000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_type_enum" AS ENUM ('DIRECT', 'GROUP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_member_role_enum" AS ENUM ('OWNER', 'MEMBER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE NULL,
        "type" "conversation_type_enum" NOT NULL DEFAULT 'DIRECT',
        "title" VARCHAR(100) NULL,
        "avatar_url" VARCHAR(500) NULL,
        "direct_user_key" VARCHAR(75) NULL,
        "creator_id" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "CK_conversations_direct_rules" CHECK (
          ("type" = 'DIRECT' AND "direct_user_key" IS NOT NULL) OR
          ("type" = 'GROUP' AND "direct_user_key" IS NULL AND "title" IS NOT NULL)
        )
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_conversations_direct_user_key"
      ON "conversations" ("direct_user_key")
      WHERE "type" = 'DIRECT' AND "deletedAt" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_updated_at"
      ON "conversations" ("updatedAt" DESC, "id" DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversation_members" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE NULL,
        "conversation_id" UUID NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role" "conversation_member_role_enum" NOT NULL DEFAULT 'MEMBER',
        "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_conversation_members_conv_user" UNIQUE ("conversation_id", "user_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_members_user_active"
      ON "conversation_members" ("user_id")
      WHERE "deletedAt" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "conversation_members" CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations" CASCADE;`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "conversation_member_role_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_type_enum";`);
  }
}
