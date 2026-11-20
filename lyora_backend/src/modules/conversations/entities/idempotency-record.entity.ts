import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('idempotency_records')
@Index('UQ_idempotency_records_user_key', ['userId', 'idempotencyKey'], {
  unique: true,
})
export class IdempotencyRecord extends AbstractBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 64, name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'GROUP_CONVERSATION',
    name: 'resource_type',
  })
  resourceType: string;

  @Column({ type: 'uuid', name: 'resource_id' })
  resourceId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: Conversation;

  @Column({ type: 'varchar', length: 64, name: 'request_hash' })
  requestHash: string;
}
