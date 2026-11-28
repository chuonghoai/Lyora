import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums/role.enum';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../users/entities/user.entity';
import { AdminPostQueryDto } from '../dto/admin-post-query.dto';
import {
  HidePostModerationDto,
  RemoveModerationReasonDto,
} from '../dto/moderate-post.dto';
import { PostComment } from '../entities/post-comment.entity';
import { PostReaction } from '../entities/post-reaction.entity';
import { Post } from '../entities/post.entity';
import {
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from '../enums/post.enums';
import {
  AdminPostCommentResponse,
  AdminPostDetailResponse,
  AdminPostItemResponse,
  AdminPostModeratorSummary,
  AdminPostStatistics,
  PaginatedAdminPosts,
} from '../interfaces/admin-post.interface';

interface RawPostStatisticsRow {
  totalPosts?: string | number;
  activePosts?: string | number;
  hiddenPosts?: string | number;
  postsToday?: string | number;
  postsThisMonth?: string | number;
  withMediaCount?: string | number;
  adminPostsCount?: string | number;
  publicCount?: string | number;
  friendsCount?: string | number;
  privateCount?: string | number;
}

function toCount(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function createEmptyReactionBreakdown(): Record<PostReactionType, number> {
  return {
    [PostReactionType.LIKE]: 0,
    [PostReactionType.LOVE]: 0,
    [PostReactionType.HAHA]: 0,
    [PostReactionType.WOW]: 0,
    [PostReactionType.SAD]: 0,
    [PostReactionType.ANGRY]: 0,
  };
}

function summarizePostExcerpt(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'bài viết đính kèm phương tiện';
  if (normalized.length <= 80) return `"${normalized}"`;
  return `"${normalized.slice(0, 77)}..."`;
}

@Injectable()
export class AdminPostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactionRepository: Repository<PostReaction>,
    @InjectRepository(PostComment)
    private readonly postCommentRepository: Repository<PostComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getStatistics(): Promise<AdminPostStatistics> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const raw = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select('COUNT(post.id)', 'totalPosts')
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.moderationStatus = :activeStatus)`,
        'activePosts',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.moderationStatus = :hiddenStatus)`,
        'hiddenPosts',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.createdAt >= :startOfToday)`,
        'postsToday',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.createdAt >= :startOfMonth)`,
        'postsThisMonth',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE jsonb_array_length(post.media) > 0)`,
        'withMediaCount',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE author.role = :adminRole)`,
        'adminPostsCount',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.visibility = :publicVis)`,
        'publicCount',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.visibility = :friendsVis)`,
        'friendsCount',
      )
      .addSelect(
        `COUNT(post.id) FILTER (WHERE post.visibility = :privateVis)`,
        'privateCount',
      )
      .setParameters({
        activeStatus: PostModerationStatus.ACTIVE,
        hiddenStatus: PostModerationStatus.HIDDEN,
        startOfToday: startOfToday.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
        adminRole: UserRole.ADMIN,
        publicVis: PostVisibility.PUBLIC,
        friendsVis: PostVisibility.FRIENDS,
        privateVis: PostVisibility.PRIVATE,
      })
      .getRawOne<RawPostStatisticsRow>();

    return {
      totalPosts: toCount(raw?.totalPosts),
      activePosts: toCount(raw?.activePosts),
      hiddenPosts: toCount(raw?.hiddenPosts),
      postsToday: toCount(raw?.postsToday),
      postsThisMonth: toCount(raw?.postsThisMonth),
      withMediaCount: toCount(raw?.withMediaCount),
      adminPostsCount: toCount(raw?.adminPostsCount),
      visibilityBreakdown: {
        [PostVisibility.PUBLIC]: toCount(raw?.publicCount),
        [PostVisibility.FRIENDS]: toCount(raw?.friendsCount),
        [PostVisibility.PRIVATE]: toCount(raw?.privateCount),
      },
    };
  }

  async findAllPaginated(
    query: AdminPostQueryDto,
  ): Promise<PaginatedAdminPosts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('post.moderationStatus = :status', { status: query.status });
    }
    if (query.visibility) {
      qb.andWhere('post.visibility = :visibility', {
        visibility: query.visibility,
      });
    }
    if (query.authorRole) {
      qb.andWhere('author.role = :authorRole', {
        authorRole: query.authorRole,
      });
    }
    if (query.hasMedia === 'true') {
      qb.andWhere('jsonb_array_length(post.media) > 0');
    } else if (query.hasMedia === 'false') {
      qb.andWhere('jsonb_array_length(post.media) = 0');
    }

    const keyword = query.search?.trim();
    if (keyword) {
      const pattern = `%${keyword}%`;
      qb.andWhere(
        new Brackets((searchScope) => {
          searchScope
            .where('post.content ILIKE :pattern', { pattern })
            .orWhere('author.fullName ILIKE :pattern', { pattern })
            .orWhere('author.email ILIKE :pattern', { pattern });
        }),
      );
    }

    const [posts, totalItems] = await qb
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = await this.mapToAdminItems(posts);

    return {
      items,
      meta: new PaginationMetaDto(page, limit, totalItems),
    };
  }

  async findOneDetail(id: string): Promise<AdminPostDetailResponse> {
    const post = await this.getPostOrThrow(id);
    const [baseItem] = await this.mapToAdminItems([post]);

    const [reactions, comments] = await Promise.all([
      this.postReactionRepository.find({ where: { postId: post.id } }),
      this.postCommentRepository.find({
        where: { postId: post.id },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const breakdown = createEmptyReactionBreakdown();
    for (const reaction of reactions) {
      breakdown[reaction.type] = (breakdown[reaction.type] ?? 0) + 1;
    }

    const mappedComments: AdminPostCommentResponse[] = comments.map((cmt) => ({
      id: cmt.id,
      author: {
        id: cmt.author?.id ?? cmt.authorId,
        fullName: cmt.author?.fullName ?? 'Người dùng Lyora',
        email: cmt.author?.email ?? '',
        avatarUrl: cmt.author?.avatarUrl ?? null,
        role: cmt.author?.role ?? UserRole.CLIENT,
      },
      content: cmt.content,
      media: cmt.media ?? null,
      createdAt: cmt.createdAt.toISOString(),
    }));

    return {
      ...baseItem,
      reactionCount:
        reactions.length > 0 ? reactions.length : baseItem.reactionCount,
      commentCount: mappedComments.length,
      reactionBreakdown: breakdown,
      comments: mappedComments,
    };
  }

  async hidePost(
    adminUser: AuthenticatedUser,
    id: string,
    dto: HidePostModerationDto,
  ): Promise<AdminPostDetailResponse> {
    const post = await this.getPostOrThrow(id);
    const reason = dto.reason.trim();

    post.moderationStatus = PostModerationStatus.HIDDEN;
    post.moderationReason = reason;
    post.moderatedAt = new Date();
    post.moderatedById = adminUser.id;

    await this.postRepository.save(post);

    if (post.authorId !== adminUser.id) {
      const excerpt = summarizePostExcerpt(post.content);
      await this.notificationsService.createModerationNotice({
        recipientId: post.authorId,
        actorId: adminUser.id,
        type: NotificationType.POST_HIDDEN,
        title: 'Bài viết của bạn đã bị ẩn bởi Quản trị viên',
        description: `Bài viết ${excerpt} đã bị ẩn do vi phạm tiêu chuẩn cộng đồng. Lý do: ${reason}`,
        targetPath: '/me',
      });
    }

    return this.findOneDetail(post.id);
  }

  async restorePost(
    adminUser: AuthenticatedUser,
    id: string,
  ): Promise<AdminPostDetailResponse> {
    const post = await this.getPostOrThrow(id);

    post.moderationStatus = PostModerationStatus.ACTIVE;
    post.moderationReason = null;
    post.moderatedAt = new Date();
    post.moderatedById = adminUser.id;

    await this.postRepository.save(post);

    if (post.authorId !== adminUser.id) {
      const excerpt = summarizePostExcerpt(post.content);
      await this.notificationsService.createModerationNotice({
        recipientId: post.authorId,
        actorId: adminUser.id,
        type: NotificationType.POST_RESTORED,
        title: 'Bài viết của bạn đã được khôi phục hiển thị',
        description: `Bài viết ${excerpt} đã được Quản trị viên khôi phục và hiển thị trở lại trên cộng đồng.`,
        targetPath: '/me',
      });
    }

    return this.findOneDetail(post.id);
  }

  async removePost(
    adminUser: AuthenticatedUser,
    id: string,
    dto?: RemoveModerationReasonDto,
  ): Promise<void> {
    const post = await this.getPostOrThrow(id);
    await this.postRepository.softDelete(post.id);

    if (post.authorId !== adminUser.id) {
      const excerpt = summarizePostExcerpt(post.content);
      const reasonSuffix = dto?.reason?.trim()
        ? ` Lý do: ${dto.reason.trim()}`
        : '';
      await this.notificationsService.createModerationNotice({
        recipientId: post.authorId,
        actorId: adminUser.id,
        type: NotificationType.POST_REMOVED,
        title: 'Bài viết của bạn đã bị gỡ bỏ',
        description: `Bài viết ${excerpt} đã bị Quản trị viên gỡ bỏ theo quy định tiêu chuẩn cộng đồng.${reasonSuffix}`,
        targetPath: '/me',
      });
    }
  }

  async removeComment(
    adminUser: AuthenticatedUser,
    postId: string,
    commentId: string,
    dto?: RemoveModerationReasonDto,
  ): Promise<void> {
    if (!isUUID(postId, '4') || !isUUID(commentId, '4')) {
      throw new NotFoundException('Không tìm thấy bình luận cần gỡ');
    }

    const post = await this.getPostOrThrow(postId);
    const comment = await this.postCommentRepository.findOne({
      where: { id: commentId, postId: post.id },
    });

    if (!comment) {
      throw new NotFoundException(
        'Không tìm thấy bình luận trong bài viết này',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(PostComment, comment.id);
      await manager
        .createQueryBuilder()
        .update(Post)
        .set({
          commentsCount: () => 'GREATEST("commentsCount" - 1, 0)',
        })
        .where('id = :postId', { postId: post.id })
        .execute();
    });

    if (comment.authorId !== adminUser.id) {
      const excerpt = summarizePostExcerpt(comment.content);
      const reasonSuffix = dto?.reason?.trim()
        ? ` Lý do: ${dto.reason.trim()}`
        : '';
      await this.notificationsService.createModerationNotice({
        recipientId: comment.authorId,
        actorId: adminUser.id,
        type: NotificationType.COMMENT_REMOVED,
        title: 'Bình luận của bạn đã bị gỡ bỏ',
        description: `Bình luận ${excerpt} đã bị Quản trị viên gỡ bỏ do không phù hợp tiêu chuẩn cộng đồng.${reasonSuffix}`,
        targetPath: '/me',
      });
    }
  }

  private async getPostOrThrow(id: string): Promise<Post> {
    if (!isUUID(id, '4')) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  private async mapToAdminItems(
    posts: Post[],
  ): Promise<AdminPostItemResponse[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.id);
    const moderatorIds = [
      ...new Set(
        posts
          .map((post) => post.moderatedById)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [reactions, comments, moderators] = await Promise.all([
      this.postReactionRepository.find({
        select: { id: true, postId: true },
        where: { postId: In(postIds) },
      }),
      this.postCommentRepository.find({
        select: { id: true, postId: true },
        where: { postId: In(postIds) },
      }),
      moderatorIds.length > 0
        ? this.userRepository.find({
            select: { id: true, fullName: true, email: true },
            where: { id: In(moderatorIds) },
          })
        : Promise.resolve([]),
    ]);

    const reactionCountMap = new Map<string, number>();
    for (const reaction of reactions) {
      reactionCountMap.set(
        reaction.postId,
        (reactionCountMap.get(reaction.postId) ?? 0) + 1,
      );
    }

    const commentCountMap = new Map<string, number>();
    for (const comment of comments) {
      commentCountMap.set(
        comment.postId,
        (commentCountMap.get(comment.postId) ?? 0) + 1,
      );
    }

    const moderatorMap = new Map<string, AdminPostModeratorSummary>();
    for (const mod of moderators) {
      moderatorMap.set(mod.id, {
        id: mod.id,
        fullName: mod.fullName,
        email: mod.email,
      });
    }

    return posts.map((post) => ({
      id: post.id,
      author: {
        id: post.author.id,
        fullName: post.author.fullName,
        email: post.author.email,
        avatarUrl: post.author.avatarUrl ?? null,
        role: post.author.role ?? UserRole.CLIENT,
      },
      content: post.content,
      visibility: post.visibility,
      media: post.media ?? [],
      taggedUserIds: post.taggedUserIds ?? [],
      moderationStatus: post.moderationStatus ?? PostModerationStatus.ACTIVE,
      moderationReason: post.moderationReason ?? null,
      moderatedAt: post.moderatedAt ? post.moderatedAt.toISOString() : null,
      moderatedBy: post.moderatedById
        ? (moderatorMap.get(post.moderatedById) ?? null)
        : null,
      reactionCount: reactionCountMap.get(post.id) ?? post.reactionsCount,
      commentCount: commentCountMap.get(post.id) ?? post.commentsCount,
      shareCount: post.sharesCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));
  }
}
