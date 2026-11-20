import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFriendshipsTable1732000001000 implements MigrationInterface {
  name = 'CreateFriendshipsTable1732000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "friendship_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "friendships" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE NULL,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "friend_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" "friendship_status_enum" NOT NULL DEFAULT 'ACCEPTED',
        CONSTRAINT "CK_friendships_no_self_friend" CHECK ("user_id" != "friend_id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_friendships_canonical_pair"
      ON "friendships" (LEAST("user_id", "friend_id"), GREATEST("user_id", "friend_id"));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_friendships_user_status"
      ON "friendships" ("user_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_friendships_friend_status"
      ON "friendships" ("friend_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "friendships" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "friendship_status_enum";`);
  }
}
