import { PaginationMetaDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums/role.enum';
import {
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from '../enums/post.enums';
import { PostMediaItem } from './post-media.interface';

export interface AdminPostStatistics {
  totalPosts: number;
  activePosts: number;
  hiddenPosts: number;
  postsToday: number;
  postsThisMonth: number;
  withMediaCount: number;
  adminPostsCount: number;
  visibilityBreakdown: Record<PostVisibility, number>;
}

export interface AdminPostAuthorResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface AdminPostModeratorSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface AdminPostCommentResponse {
  id: string;
  author: AdminPostAuthorResponse;
  content: string;
  media: PostMediaItem | null;
  createdAt: string;
}

export interface AdminPostItemResponse {
  id: string;
  author: AdminPostAuthorResponse;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds: string[];
  moderationStatus: PostModerationStatus;
  moderationReason: string | null;
  moderatedAt: string | null;
  moderatedBy: AdminPostModeratorSummary | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostDetailResponse extends AdminPostItemResponse {
  reactionBreakdown: Record<PostReactionType, number>;
  comments: AdminPostCommentResponse[];
}

export interface PaginatedAdminPosts {
  items: AdminPostItemResponse[];
  meta: PaginationMetaDto;
}
