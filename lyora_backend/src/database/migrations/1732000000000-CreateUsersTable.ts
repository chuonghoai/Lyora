import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1732000000000 implements MigrationInterface {
  name = 'CreateUsersTable1732000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('CLIENT', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "passwordHash" VARCHAR(255) NOT NULL,
        "fullName" VARCHAR(150) NOT NULL,
        "phoneNumber" VARCHAR(20) NULL,
        "bio" VARCHAR(300) NULL,
        "location" VARCHAR(120) NULL,
        "avatarUrl" VARCHAR(500) NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'CLIENT',
        "isActive" BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum";`);
  }
}
