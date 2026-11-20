import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ConversationMemberRole } from '../enums/conversation-member-role.enum';
import { Conversation } from './conversation.entity';

@Entity('conversation_members')
@Index('UQ_conversation_members_conv_user', ['conversationId', 'userId'], {
  unique: true,
})
@Index('IDX_conversation_members_user_active', ['userId'])
export class ConversationMember extends AbstractBaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ConversationMemberRole,
    default: ConversationMemberRole.MEMBER,
  })
  role: ConversationMemberRole;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'joined_at',
  })
  joinedAt: Date;
}
