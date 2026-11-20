import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';

@Entity('friendships')
@Check(`"user_id" != "friend_id"`)
@Index(['userId', 'status'])
@Index(['friendId', 'status'])
export class Friendship extends AbstractBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'friend_id' })
  friendId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend: User;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.ACCEPTED,
  })
  status: FriendshipStatus;
}
