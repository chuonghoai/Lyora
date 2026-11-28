import { PaginationMetaDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums/role.enum';
import {
  PostAppealStatus,
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from '../enums/post.enums';
import { PostMediaItem } from './post-media.interface';
import { PostAppealSummaryResponse } from './post-response.interface';

export interface AdminPostStatistics {
  totalPosts: number;
  activePosts: number;
  hiddenPosts: number;
  pendingAppealsCount: number;
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

export interface AdminPostAppealItemResponse {
  id: string;
  postId: string;
  post: {
    id: string;
    content: string;
    visibility: PostVisibility;
    media: PostMediaItem[];
    moderationStatus: PostModerationStatus;
    moderationReason: string | null;
    moderatedAt: string | null;
    createdAt: string;
  };
  appellant: AdminPostAuthorResponse;
  reasonCategory: string;
  reasonDetail: string;
  status: PostAppealStatus;
  adminEvidence: string | null;
  resolvedAt: string | null;
  resolvedBy: AdminPostModeratorSummary | null;
  totalAppealsCount: number;
  hasEvidence: boolean;
  recentAppeals: PostAppealSummaryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminPostAppeals {
  items: AdminPostAppealItemResponse[];
  meta: PaginationMetaDto;
}

export interface AdminPostAppealHistoryItemResponse {
  id: string;
  postId: string;
  roundNumber: number;
  appellant: AdminPostAuthorResponse;
  reasonCategory: string;
  reasonDetail: string;
  status: PostAppealStatus;
  adminEvidence: string | null;
  resolvedAt: string | null;
  resolvedBy: AdminPostModeratorSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminPostAppealHistory {
  items: AdminPostAppealHistoryItemResponse[];
  meta: PaginationMetaDto;
}
