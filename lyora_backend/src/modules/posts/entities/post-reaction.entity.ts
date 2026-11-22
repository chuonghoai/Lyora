import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PostReactionType } from '../enums/post.enums';
import { Post } from './post.entity';

@Entity('post_reactions')
@Index(['postId', 'userId'], { unique: true })
export class PostReaction extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PostReactionType,
    default: PostReactionType.LIKE,
  })
  type: PostReactionType;
}
