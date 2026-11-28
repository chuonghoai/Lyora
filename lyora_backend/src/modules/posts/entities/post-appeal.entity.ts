import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PostAppealStatus } from '../enums/post.enums';
import { Post } from './post.entity';

@Entity('post_appeals')
export class PostAppeal extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Index()
  @Column({ type: 'uuid' })
  appellantId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appellantId' })
  appellant: User;

  @Column({ type: 'varchar', length: 120 })
  reasonCategory: string;

  @Column({ type: 'text' })
  reasonDetail: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 24,
    default: PostAppealStatus.PENDING,
  })
  status: PostAppealStatus;

  @Column({ type: 'text', nullable: true })
  adminEvidence?: string | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedById?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;
}
