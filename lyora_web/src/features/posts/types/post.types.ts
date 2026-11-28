import type { MediaViolationInfo, PaginationMeta } from '@/core';

export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export type PostMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface PostMediaItem {
  id?: string;
  url: string;
  type: PostMediaType;
  alt?: string;
  duration?: number;
  fileName?: string;
  size?: number;
}

export interface PostViolationFlag {
  reason: string;
  flaggedAt: string | null;
}

export interface PostAuthor {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  avatarViolation?: MediaViolationInfo | null;
}

export interface PostComment {
  id: string;
  parentId?: string | null;
  author: PostAuthor;
  content: string;
  media?: PostMediaItem | null;
  createdAt: string;
}

export type ReactionBreakdown = Record<ReactionType, number>;

export type PostAppealStatus = 'PENDING' | 'RESTORED' | 'REJECTED';

export type AdminPostAppealStatusFilter = 'ALL' | PostAppealStatus;

export interface PostAppealSummary {
  id: string;
  status: PostAppealStatus;
  reasonCategory: string;
  reasonDetail: string;
  adminEvidence: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
}

export interface PostTaggedUser {
  id: string;
  fullName: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds?: string[];
  taggedUsers?: PostTaggedUser[];
  moderationStatus?: PostModerationStatus;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  violationFlag?: PostViolationFlag | null;
  appeal?: PostAppealSummary | null;
  appeals?: PostAppealSummary[];
  reactionCount: number;
  reactionBreakdown: ReactionBreakdown;
  userReaction: ReactionType | null;
  commentCount: number;
  comments: PostComment[];
  shareCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostCommentsQueryParams {
  page?: number;
  limit?: number;
}

export interface PaginatedPostCommentsResult {
  items: PostComment[];
  meta: PaginationMeta;
}

export interface CreatePostAppealPayload {
  postId: string;
  reasonCategory: string;
  reasonDetail: string;
}

export type PostsFeedFilter = 'all' | 'mine' | 'saved';

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: PostsFeedFilter;
  authorId?: string;
  visibility?: PostVisibility;
  mediaType?: PostMediaType;
}

export interface PaginatedPostsResult {
  items: Post[];
  meta: PaginationMeta;
}

export interface CreatePostPayload {
  content: string;
  visibility: PostVisibility;
  media?: PostMediaItem[];
  taggedUserIds?: string[];
}

export interface UpdatePostPayload {
  postId: string;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds?: string[];
}

export interface ReactPostPayload {
  postId: string;
  reactionType: ReactionType;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  media?: PostMediaItem | null;
}

export interface PostReactionUser {
  id: string;
  user: PostAuthor;
  reactionType: ReactionType;
  createdAt: string;
}

export interface PostReactionsQueryParams {
  page?: number;
  limit?: number;
  reactionType?: ReactionType;
}

export interface PaginatedPostReactionsResult {
  items: PostReactionUser[];
  meta: PaginationMeta;
  breakdown: ReactionBreakdown;
}

export interface PostShareUser {
  id: string;
  user: PostAuthor;
  createdAt: string;
}

export interface PostSharesQueryParams {
  page?: number;
  limit?: number;
}

export interface PaginatedPostSharesResult {
  items: PostShareUser[];
  meta: PaginationMeta;
}

export type PostSuggestionTone =
  | 'FRIENDLY'
  | 'FUNNY'
  | 'PROFESSIONAL'
  | 'INSPIRING'
  | 'CONCISE';

export interface SuggestPostMediaContextItem {
  type: PostMediaType;
  fileName?: string;
  alt?: string;
  duration?: number;
}

export interface SuggestPostContentPayload {
  topic?: string;
  currentContent?: string;
  tone: PostSuggestionTone;
  visibility?: PostVisibility;
  taggedUserNames?: string[];
  mediaItems?: SuggestPostMediaContextItem[];
  mediaFiles?: File[];
}

export interface PostContentSuggestion {
  id: string;
  content: string;
}

export interface PostSuggestionsResult {
  tone: PostSuggestionTone;
  suggestions: PostContentSuggestion[];
}

export type PostModerationStatus = 'ACTIVE' | 'HIDDEN';

export type AdminPostStatusFilter = 'ALL' | PostModerationStatus;

export type AdminPostAuthorRole = 'ADMIN' | 'CLIENT';

export type AdminPostAuthorRoleFilter = 'ALL' | AdminPostAuthorRole;

export type AdminPostVisibilityFilter = 'ALL' | PostVisibility;

export type AdminPostMediaFilter = 'ALL' | 'WITH_MEDIA' | 'TEXT_ONLY';

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

export interface AdminPostAuthor {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  avatarViolation?: MediaViolationInfo | null;
  role: AdminPostAuthorRole;
}

export interface AdminPostModeratorSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface AdminPostComment {
  id: string;
  author: AdminPostAuthor;
  content: string;
  media: PostMediaItem | null;
  createdAt: string;
}

export interface AdminPostItem {
  id: string;
  author: AdminPostAuthor;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds: string[];
  moderationStatus: PostModerationStatus;
  moderationReason: string | null;
  moderatedAt: string | null;
  moderatedBy: AdminPostModeratorSummary | null;
  violationFlag?: PostViolationFlag | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostDetail extends AdminPostItem {
  reactionBreakdown: ReactionBreakdown;
  comments: AdminPostComment[];
}

export interface AdminPostsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminPostStatusFilter;
  visibility?: PostVisibility;
  authorRole?: AdminPostAuthorRole;
  hasMedia?: 'true' | 'false';
}

export interface PaginatedAdminPostsResult {
  items: AdminPostItem[];
  meta: PaginationMeta;
}

export interface HideAdminPostPayload {
  postId: string;
  reason: string;
}

export interface FlagAdminPostViolationPayload {
  postId: string;
  reason: string;
}

export interface RemoveAdminPostPayload {
  postId: string;
  reason?: string;
}

export interface RemoveAdminCommentPayload {
  postId: string;
  commentId: string;
  reason?: string;
}

export interface AdminPostAppealItem {
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
  appellant: AdminPostAuthor;
  reasonCategory: string;
  reasonDetail: string;
  status: PostAppealStatus;
  adminEvidence: string | null;
  resolvedAt: string | null;
  resolvedBy: AdminPostModeratorSummary | null;
  totalAppealsCount: number;
  hasEvidence: boolean;
  recentAppeals: PostAppealSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostAppealsQueryParams {
  page?: number;
  limit?: number;
  status?: AdminPostAppealStatusFilter;
  search?: string;
}

export interface PaginatedAdminPostAppealsResult {
  items: AdminPostAppealItem[];
  meta: PaginationMeta;
}

export interface AdminPostAppealHistoryItem {
  id: string;
  postId: string;
  roundNumber: number;
  appellant: AdminPostAuthor;
  reasonCategory: string;
  reasonDetail: string;
  status: PostAppealStatus;
  adminEvidence: string | null;
  resolvedAt: string | null;
  resolvedBy: AdminPostModeratorSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostAppealHistoryQueryParams {
  page?: number;
  limit?: number;
}

export interface PaginatedAdminPostAppealHistoryResult {
  items: AdminPostAppealHistoryItem[];
  meta: PaginationMeta;
}

export interface RejectPostAppealPayload {
  appealId: string;
  evidence: string;
}
