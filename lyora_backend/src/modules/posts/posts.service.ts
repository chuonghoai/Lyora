import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Brackets, In, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { Post } from './entities/post.entity';
import { PostReactionType, PostVisibility } from './enums/post.enums';
import { PostResponse } from './interfaces/post-response.interface';

export interface PaginatedPosts {
  items: PostResponse[];
  meta: PaginationMetaDto;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    const created = await this.postRepository.save(
      this.postRepository.create({
        authorId: currentUser.id,
        content,
        visibility: dto.visibility ?? PostVisibility.PUBLIC,
        media,
        taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : null,
      }),
    );

    return this.toResponse(await this.getPostOrThrow(created.id));
  }

  async findAllPaginated(
    currentUser: AuthenticatedUser,
    query: PostQueryDto,
  ): Promise<PaginatedPosts> {
    const { page, limit, search, visibility, authorId, filter } = query;

    if (filter === 'saved') {
      return { items: [], meta: new PaginationMetaDto(page, limit, 0) };
    }

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    // Bài PUBLIC hiển thị cho mọi người; FRIENDS/PRIVATE chỉ tác giả xem được
    if (filter === 'mine') {
      qb.where('post.authorId = :me', { me: currentUser.id });
    } else {
      qb.where(
        new Brackets((visibleScope) => {
          visibleScope
            .where('post.visibility = :publicVisibility', {
              publicVisibility: PostVisibility.PUBLIC,
            })
            .orWhere('post.authorId = :me', { me: currentUser.id });
        }),
      );
    }

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
      items: posts.map((post) => this.toResponse(post)),
      meta: new PaginationMetaDto(page, limit, totalItems),
    };
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<PostResponse> {
    const post = await this.getPostOrThrow(id);
    const canView =
      post.visibility === PostVisibility.PUBLIC ||
      post.authorId === currentUser.id ||
      currentUser.role === UserRole.ADMIN;

    if (!canView) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return this.toResponse(post);
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

  private toResponse(post: Post): PostResponse {
    return {
      id: post.id,
      author: {
        id: post.author.id,
        fullName: post.author.fullName,
        email: post.author.email,
        avatarUrl: post.author.avatarUrl ?? null,
      },
      content: post.content,
      visibility: post.visibility,
      media: post.media ?? [],
      taggedUserIds: post.taggedUserIds ?? [],
      reactionCount: post.reactionsCount,
      reactionBreakdown: {
        [PostReactionType.LIKE]: 0,
        [PostReactionType.LOVE]: 0,
        [PostReactionType.HAHA]: 0,
        [PostReactionType.WOW]: 0,
        [PostReactionType.SAD]: 0,
        [PostReactionType.ANGRY]: 0,
      },
      userReaction: null,
      commentCount: post.commentsCount,
      comments: [],
      shareCount: post.sharesCount,
      bookmarkCount: 0,
      isBookmarked: false,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
