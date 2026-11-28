import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Brackets, In, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import {
  PostReactionsQueryDto,
  PostSharesQueryDto,
} from './dto/post-interactions-query.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostShare } from './entities/post-share.entity';
import { Post } from './entities/post.entity';
import {
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from './enums/post.enums';
import {
  PostCommentResponse,
  PostReactionUserResponse,
  PostResponse,
  PostShareUserResponse,
} from './interfaces/post-response.interface';

export interface PaginatedPosts {
  items: PostResponse[];
  meta: PaginationMetaDto;
}

export interface PaginatedPostReactions {
  items: PostReactionUserResponse[];
  meta: PaginationMetaDto;
}

export interface PaginatedPostShares {
  items: PostShareUserResponse[];
  meta: PaginationMetaDto;
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

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactionRepository: Repository<PostReaction>,
    @InjectRepository(PostComment)
    private readonly postCommentRepository: Repository<PostComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @Optional()
    @InjectRepository(PostShare)
    private readonly postShareRepository?: Repository<PostShare>,
  ) {}

  async create(
    currentUser: AuthenticatedUser,
    dto: CreatePostDto,
  ): Promise<PostResponse> {
    const content = dto.content?.trim() ?? '';
    const media = dto.media ?? [];

    if (content.length === 0 && media.length === 0) {
      throw new BadRequestException(
        'Vui lòng nhập nội dung hoặc đính kèm ít nhất một ảnh, video, bản ghi âm',
      );
    }

    const taggedUserIds = await this.resolveTaggedUserIds(
      dto.taggedUserIds,
      currentUser.id,
    );

    const visibility =
      currentUser.role === UserRole.ADMIN
        ? PostVisibility.PUBLIC
        : (dto.visibility ?? PostVisibility.PUBLIC);

    const created = await this.postRepository.save(
      this.postRepository.create({
        authorId: currentUser.id,
        content,
        visibility,
        media,
        taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : null,
      }),
    );

    const [response] = await this.toResponses(
      [await this.getPostOrThrow(created.id)],
      currentUser.id,
    );
    return response;
  }

  async findAllPaginated(
    currentUser: AuthenticatedUser,
    query: PostQueryDto,
  ): Promise<PaginatedPosts> {
    const { page, limit, search, visibility, authorId, filter } = query;

    if (filter === 'saved') {
      throw new NotImplementedException(
        'Tính năng bài viết đã lưu hiện chưa được hỗ trợ trên hệ thống',
      );
    }

    const friendIds = await this.getAcceptedFriendIds(currentUser.id);

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (filter === 'mine') {
      qb.where('post.authorId = :me', { me: currentUser.id });
    } else if (currentUser.role === UserRole.ADMIN && authorId) {
      // Quản trị viên xem toàn bộ bài viết của một người dùng cụ thể phục vụ kiểm duyệt
      qb.where('post.authorId = :authorId', { authorId });
    } else {
      qb.where(
        new Brackets((visibleScope) => {
          visibleScope
            .where('post.visibility = :publicVisibility', {
              publicVisibility: PostVisibility.PUBLIC,
            })
            .orWhere('post.authorId = :me', { me: currentUser.id });

          if (friendIds.length > 0) {
            visibleScope.orWhere(
              '(post.visibility = :friendsVisibility AND post.authorId IN (:...friendIds))',
              {
                friendsVisibility: PostVisibility.FRIENDS,
                friendIds,
              },
            );
          }
        }),
      );
    }

    qb.andWhere('post.moderationStatus = :activeModerationStatus', {
      activeModerationStatus: PostModerationStatus.ACTIVE,
    });

    if (visibility) {
      qb.andWhere('post.visibility = :visibility', { visibility });
    }
    if (authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId });
    }
    const keyword = search?.trim();
    if (keyword) {
      qb.andWhere('post.content ILIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [posts, totalItems] = await qb
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.toResponses(posts, currentUser.id),
      meta: new PaginationMetaDto(page, limit, totalItems),
    };
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<PostResponse> {
    const post = await this.assertCanViewPost(currentUser, id);
    const [response] = await this.toResponses([post], currentUser.id);
    return response;
  }

  async getPostReactions(
    currentUser: AuthenticatedUser,
    postId: string,
    query: PostReactionsQueryDto,
  ): Promise<PaginatedPostReactions> {
    const post = await this.assertCanViewPost(currentUser, postId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [rows, totalItems] = await this.postReactionRepository.findAndCount({
      where: {
        postId: post.id,
        ...(query.reactionType ? { type: query.reactionType } : {}),
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const items: PostReactionUserResponse[] = rows.map((row) => ({
      id: row.id,
      user: {
        id: row.user?.id ?? row.userId,
        fullName: row.user?.fullName ?? 'Người dùng Lyora',
        ...(isAdmin || row.userId === currentUser.id
          ? { email: row.user?.email }
          : {}),
        avatarUrl: row.user?.avatarUrl ?? null,
      },
      reactionType: row.type,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      meta: new PaginationMetaDto(page, limit, totalItems),
    };
  }

  async getPostShares(
    currentUser: AuthenticatedUser,
    postId: string,
    query: PostSharesQueryDto,
  ): Promise<PaginatedPostShares> {
    const post = await this.assertCanViewPost(currentUser, postId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (!this.postShareRepository) {
      return {
        items: [],
        meta: new PaginationMetaDto(page, limit, 0),
      };
    }

    const [rows, totalItems] = await this.postShareRepository.findAndCount({
      where: { postId: post.id },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const items: PostShareUserResponse[] = rows.map((row) => ({
      id: row.id,
      user: {
        id: row.user?.id ?? row.userId,
        fullName: row.user?.fullName ?? 'Người dùng Lyora',
        ...(isAdmin || row.userId === currentUser.id
          ? { email: row.user?.email }
          : {}),
        avatarUrl: row.user?.avatarUrl ?? null,
      },
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      meta: new PaginationMetaDto(page, limit, totalItems),
    };
  }

  private async assertCanViewPost(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<Post> {
    const post = await this.getPostOrThrow(id);
    const isHidden = post.moderationStatus === PostModerationStatus.HIDDEN;
    if (
      isHidden &&
      post.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const isFriendVisible =
      post.visibility === PostVisibility.FRIENDS &&
      (await this.isAcceptedFriend(currentUser.id, post.authorId));

    const canView =
      post.visibility === PostVisibility.PUBLIC ||
      post.authorId === currentUser.id ||
      currentUser.role === UserRole.ADMIN ||
      isFriendVisible;

    if (!canView) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<void> {
    const post = await this.getPostOrThrow(id);

    if (
      post.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
    }
    await this.postRepository.softDelete(post.id);
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

  private async getAcceptedFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { userId, status: FriendshipStatus.ACCEPTED },
        { friendId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId,
    );
  }

  private async isAcceptedFriend(
    userAId: string,
    userBId: string,
  ): Promise<boolean> {
    if (userAId === userBId) return true;
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          userId: userAId,
          friendId: userBId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          userId: userBId,
          friendId: userAId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    return Boolean(friendship);
  }

  private async resolveTaggedUserIds(
    taggedUserIds: string[] | undefined,
    authorId: string,
  ): Promise<string[]> {
    const candidates = [...new Set(taggedUserIds ?? [])].filter(
      (userId) => userId !== authorId,
    );
    if (candidates.length === 0) {
      return [];
    }
    const users = await this.userRepository.find({
      select: { id: true },
      where: { id: In(candidates), isActive: true },
    });
    return users.map((user) => user.id);
  }

  private async toResponses(
    posts: Post[],
    currentUserId: string,
  ): Promise<PostResponse[]> {
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post.id);

    const [reactions, comments] = await Promise.all([
      this.postReactionRepository.find({
        where: { postId: In(postIds) },
      }),
      this.postCommentRepository.find({
        where: { postId: In(postIds) },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const breakdownByPost = new Map<string, Record<PostReactionType, number>>();
    const totalReactionsByPost = new Map<string, number>();
    const userReactionByPost = new Map<string, PostReactionType>();

    for (const reaction of reactions) {
      const breakdown =
        breakdownByPost.get(reaction.postId) ?? createEmptyReactionBreakdown();
      breakdown[reaction.type] = (breakdown[reaction.type] ?? 0) + 1;
      breakdownByPost.set(reaction.postId, breakdown);

      totalReactionsByPost.set(
        reaction.postId,
        (totalReactionsByPost.get(reaction.postId) ?? 0) + 1,
      );

      if (reaction.userId === currentUserId) {
        userReactionByPost.set(reaction.postId, reaction.type);
      }
    }

    const commentsByPost = new Map<string, PostCommentResponse[]>();
    for (const comment of comments) {
      const list = commentsByPost.get(comment.postId) ?? [];
      list.push({
        id: comment.id,
        parentId: comment.parentId ?? null,
        author: {
          id: comment.author?.id ?? comment.authorId,
          fullName: comment.author?.fullName ?? 'Người dùng Lyora',
          avatarUrl: comment.author?.avatarUrl ?? null,
        },
        content: comment.content,
        media: comment.media ?? null,
        createdAt: comment.createdAt.toISOString(),
      });
      commentsByPost.set(comment.postId, list);
    }

    return posts.map((post) => {
      const postComments = commentsByPost.get(post.id) ?? [];
      const breakdown =
        breakdownByPost.get(post.id) ?? createEmptyReactionBreakdown();
      const reactionCount =
        totalReactionsByPost.get(post.id) ?? post.reactionsCount;
      const commentCount =
        postComments.length > 0 ? postComments.length : post.commentsCount;

      return {
        id: post.id,
        author: {
          id: post.author.id,
          fullName: post.author.fullName,
          ...(post.authorId === currentUserId
            ? { email: post.author.email }
            : {}),
          avatarUrl: post.author.avatarUrl ?? null,
        },
        content: post.content,
        visibility: post.visibility,
        media: post.media ?? [],
        taggedUserIds: post.taggedUserIds ?? [],
        reactionCount,
        reactionBreakdown: breakdown,
        userReaction: userReactionByPost.get(post.id) ?? null,
        commentCount,
        comments: postComments,
        shareCount: post.sharesCount,
        bookmarkCount: 0,
        isBookmarked: false,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });
  }
}
