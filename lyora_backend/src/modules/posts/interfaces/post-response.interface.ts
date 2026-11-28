import { PostMediaItem } from './post-media.interface';
import {
  PostAppealStatus,
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from '../enums/post.enums';

export interface PostAuthorResponse {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl: string | null;
}

export interface PostCommentResponse {
  id: string;
  parentId: string | null;
  author: PostAuthorResponse;
  content: string;
  media: PostMediaItem | null;
  createdAt: string;
}

export interface PostReactionUserResponse {
  id: string;
  user: PostAuthorResponse;
  reactionType: ReactionTypeAlias;
  createdAt: string;
}

type ReactionTypeAlias = PostReactionType;

export interface PostShareUserResponse {
  id: string;
  user: PostAuthorResponse;
  createdAt: string;
}

export interface PostAppealSummaryResponse {
  id: string;
  status: PostAppealStatus;
  reasonCategory: string;
  reasonDetail: string;
  adminEvidence: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
}

export interface PostResponse {
  id: string;
  author: PostAuthorResponse;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds: string[];
  moderationStatus: PostModerationStatus;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  appeal?: PostAppealSummaryResponse | null;
  appeals?: PostAppealSummaryResponse[];
  reactionCount: number;
  reactionBreakdown: Record<PostReactionType, number>;
  userReaction: PostReactionType | null;
  commentCount: number;
  comments: PostCommentResponse[];
  shareCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}
