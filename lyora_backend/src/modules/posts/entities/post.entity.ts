import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PostVisibility } from '../enums/post.enums';
import { PostMediaItem } from '../interfaces/post-media.interface';

@Entity('posts')
@Index(['createdAt'])
export class Post extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text', default: '' })
  content: string;

  @Index()
  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  media: PostMediaItem[];

  @Column({ type: 'jsonb', nullable: true })
  taggedUserIds?: string[] | null;

  @Column({ type: 'int', default: 0 })
  reactionsCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  sharesCount: number;
}
