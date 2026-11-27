import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateNotificationsTable1732000005000 implements MigrationInterface {
  name = 'CreateNotificationsTable1732000005000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "notifications" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE NULL, "recipient_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "type" VARCHAR(40) NOT NULL, "title" VARCHAR(255) NOT NULL, "description" VARCHAR(500) NOT NULL, "target_path" VARCHAR(120) NULL, "is_read" BOOLEAN NOT NULL DEFAULT false); CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient_read_created" ON "notifications" ("recipient_id", "is_read", "createdAt");`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "notifications" CASCADE');
  }
}
