import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ConversationType } from '../enums/conversation-type.enum';
import { ConversationMember } from './conversation-member.entity';

@Entity('conversations')
@Index('IDX_conversations_updated_at', ['updatedAt', 'id'])
export class Conversation extends AbstractBaseEntity {
  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl?: string | null;

  @Column({
    type: 'varchar',
    length: 75,
    nullable: true,
    name: 'direct_user_key',
  })
  directUserKey?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'creator_id' })
  creatorId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator?: User | null;

  @OneToMany(() => ConversationMember, (member) => member.conversation, {
    cascade: true,
  })
  members: ConversationMember[];
}
