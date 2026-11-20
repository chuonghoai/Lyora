import { z } from 'zod';
import type {
  PostSuggestionTone,
  ReactionBreakdown,
  ReactionType,
} from '../types/post.types';

export const postMediaItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().min(1, 'Đường dẫn phương tiện không được để trống'),
  type: z.enum(['IMAGE', 'VIDEO', 'AUDIO']),
  alt: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  fileName: z.string().optional(),
  size: z.number().nonnegative().optional(),
});

export const createPostSchema = z
  .object({
    content: z.string().trim().max(5000, 'Nội dung bài viết tối đa 5.000 ký tự'),
    visibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    media: z.array(postMediaItemSchema).max(8, 'Tối đa 8 ảnh, video hoặc bản ghi âm cho mỗi bài viết').optional().default([]),
  })
  .refine((data) => data.content.length > 0 || (data.media && data.media.length > 0), {
    message: 'Vui lòng nhập nội dung bài viết hoặc đính kèm ít nhất 1 ảnh, video, bản ghi âm',
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
  activeTextClass: string;
  activeBgClass: string;
}

export const REACTION_OPTIONS: readonly ReactionMeta[] = [
  {
    type: 'LIKE',
    label: 'Thích',
    activeTextClass: 'text-primary',
    activeBgClass: 'bg-secondary/70',
  },
  {
    type: 'LOVE',
    label: 'Yêu thích',
    activeTextClass: 'text-accent',
    activeBgClass: 'bg-accent/10',
  },
  {
    type: 'HAHA',
    label: 'Haha',
    activeTextClass: 'text-warning',
    activeBgClass: 'bg-warning/10',
  },
  {
    type: 'WOW',
    label: 'Wow',
    activeTextClass: 'text-warning',
    activeBgClass: 'bg-warning/10',
  },
  {
    type: 'SAD',
    label: 'Buồn',
    activeTextClass: 'text-info',
    activeBgClass: 'bg-info/10',
  },
  {
    type: 'ANGRY',
    label: 'Phẫn nộ',
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

export interface PostSuggestionToneOption {
  value: PostSuggestionTone;
  label: string;
}

export const POST_SUGGESTION_TONES: readonly PostSuggestionToneOption[] = [
  { value: 'FRIENDLY', label: 'Thân thiện' },
  { value: 'FUNNY', label: 'Hài hước' },
  { value: 'PROFESSIONAL', label: 'Chuyên nghiệp' },
  { value: 'INSPIRING', label: 'Truyền cảm hứng' },
  { value: 'CONCISE', label: 'Ngắn gọn' },
] as const;

export const suggestPostContentSchema = z
  .object({
    topic: z.string().trim().max(500, 'Ý chính tối đa 500 ký tự').optional(),
    currentContent: z
      .string()
      .trim()
      .max(5000, 'Nội dung hiện tại tối đa 5.000 ký tự')
      .optional(),
    tone: z.enum(['FRIENDLY', 'FUNNY', 'PROFESSIONAL', 'INSPIRING', 'CONCISE'], {
      message: 'Giọng điệu không hợp lệ',
    }),
  })
  .refine((data) => Boolean(data.topic?.length || data.currentContent?.length), {
    message: 'Vui lòng nhập ý chính hoặc viết vài dòng để AI gợi ý',
    path: ['topic'],
  });

export type SuggestPostContentFormValues = z.infer<typeof suggestPostContentSchema>;
