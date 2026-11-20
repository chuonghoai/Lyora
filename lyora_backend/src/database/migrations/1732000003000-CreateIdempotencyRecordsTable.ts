import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyRecordsTable1732000003000 implements MigrationInterface {
  name = 'CreateIdempotencyRecordsTable1732000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "idempotency_records" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE NULL,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "idempotency_key" VARCHAR(64) NOT NULL,
        "resource_type" VARCHAR(32) NOT NULL DEFAULT 'GROUP_CONVERSATION',
        "resource_id" UUID NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "request_hash" VARCHAR(64) NOT NULL,
        CONSTRAINT "UQ_idempotency_records_user_key" UNIQUE ("user_id", "idempotency_key")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_idempotency_records_user_key"
      ON "idempotency_records" ("user_id", "idempotency_key");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "idempotency_records" CASCADE;`,
    );
  }
}
