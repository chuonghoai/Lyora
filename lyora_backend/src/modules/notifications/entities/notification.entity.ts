import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  POST_HIDDEN = 'POST_HIDDEN',
  POST_RESTORED = 'POST_RESTORED',
  POST_REMOVED = 'POST_REMOVED',
  COMMENT_REMOVED = 'COMMENT_REMOVED',
}

@Entity('notifications')
@Index(['recipientId', 'isRead', 'createdAt'])
export class Notification extends AbstractBaseEntity {
  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId: string;

  @Column({ type: 'varchar', length: 40 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 120, nullable: true, name: 'target_path' })
  targetPath: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;
}
