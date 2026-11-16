import { z } from 'zod';
import type { ReactionBreakdown, ReactionType } from '../types/post.types';

export const postMediaItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().min(1, 'Đường dẫn phương tiện không được để trống'),
  type: z.enum(['IMAGE', 'VIDEO']),
  alt: z.string().optional(),
});

export const createPostSchema = z
  .object({
    content: z.string().trim().max(5000, 'Nội dung bài viết tối đa 5.000 ký tự'),
    visibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    media: z.array(postMediaItemSchema).max(8, 'Tối đa 8 ảnh hoặc video cho mỗi bài viết').optional().default([]),
  })
  .refine((data) => data.content.length > 0 || (data.media && data.media.length > 0), {
    message: 'Vui lòng nhập nội dung bài viết hoặc đính kèm ít nhất 1 ảnh/video',
    path: ['content'],
  });

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

export const createCommentSchema = z
  .object({
    content: z.string().trim().max(1000, 'Bình luận tối đa 1.000 ký tự'),
    media: postMediaItemSchema.nullable().optional(),
  })
  .refine((data) => data.content.length > 0 || Boolean(data.media), {
    message: 'Vui lòng nhập nội dung hoặc chọn ảnh/video cho bình luận',
    path: ['content'],
  });

export type CreateCommentFormValues = z.infer<typeof createCommentSchema>;

export interface ReactionMeta {
  type: ReactionType;
  label: string;
  emoji: string;
  activeTextClass: string;
  activeBgClass: string;
}

export const REACTION_OPTIONS: readonly ReactionMeta[] = [
  {
    type: 'LIKE',
    label: 'Thích',
    emoji: '👍',
    activeTextClass: 'text-primary',
    activeBgClass: 'bg-secondary/70',
  },
  {
    type: 'LOVE',
    label: 'Yêu thích',
    emoji: '❤️',
    activeTextClass: 'text-accent',
    activeBgClass: 'bg-accent/10',
  },
  {
    type: 'HAHA',
    label: 'Haha',
    emoji: '😂',
    activeTextClass: 'text-warning',
    activeBgClass: 'bg-warning/10',
  },
  {
    type: 'WOW',
    label: 'Wow',
    emoji: '😮',
    activeTextClass: 'text-warning',
    activeBgClass: 'bg-warning/10',
  },
  {
    type: 'SAD',
    label: 'Buồn',
    emoji: '😢',
    activeTextClass: 'text-info',
    activeBgClass: 'bg-info/10',
  },
  {
    type: 'ANGRY',
    label: 'Phẫn nộ',
    emoji: '😡',
    activeTextClass: 'text-error',
    activeBgClass: 'bg-error/10',
  },
] as const;

export function getReactionMeta(type: ReactionType): ReactionMeta {
  return REACTION_OPTIONS.find((item) => item.type === type) ?? REACTION_OPTIONS[0];
}

export function getTopReactions(breakdown: ReactionBreakdown, limit: number = 3): ReactionMeta[] {
  return REACTION_OPTIONS.filter((item) => (breakdown[item.type] ?? 0) > 0)
    .sort((a, b) => (breakdown[b.type] ?? 0) - (breakdown[a.type] ?? 0))
    .slice(0, limit);
}
