import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { DatabaseSafetyGuard } from './database-safety.guard';
import { parsePostgresConnectionConfig } from './postgres-connection.util';
import { ConversationMember } from '../modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../modules/conversations/entities/idempotency-record.entity';
import { Friendship } from '../modules/friends/entities/friendship.entity';
import { User } from '../modules/users/entities/user.entity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseRawUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/lyora_db';

// Switch database name strictly to lyora_test_db
const testRawUrl = baseRawUrl.replace(/\/lyora_db(\?|$)/, '/lyora_test_db$1');
DatabaseSafetyGuard.validateTestDatabaseUrl(testRawUrl);

const { url, ssl } = parsePostgresConnectionConfig(testRawUrl);

export const TestAppDataSource = new DataSource({
  type: 'postgres',
  url,
  ssl,
  entities: [
    User,
    Friendship,
    Conversation,
    ConversationMember,
    IdempotencyRecord,
  ],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
});
