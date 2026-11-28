import { PostMediaItem } from './post-media.interface';
import { PostReactionType, PostVisibility } from '../enums/post.enums';

export interface PostAuthorResponse {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl: string | null;
}

export interface PostCommentResponse {
  id: string;
  author: PostAuthorResponse;
  content: string;
  media: PostMediaItem | null;
  createdAt: string;
}

export interface PostResponse {
  id: string;
  author: PostAuthorResponse;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  taggedUserIds: string[];
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
