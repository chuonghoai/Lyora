import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { parsePostgresConnectionConfig } from './postgres-connection.util';
import { ConversationMember } from '../modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../modules/conversations/entities/idempotency-record.entity';
import { Friendship } from '../modules/friends/entities/friendship.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { User } from '../modules/users/entities/user.entity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/lyora_db';
const { url, ssl } = parsePostgresConnectionConfig(rawUrl);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url,
  ssl,
  entities: [
    User,
    Friendship,
    Notification,
    Conversation,
    ConversationMember,
    IdempotencyRecord,
  ],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
});
