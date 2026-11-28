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

export const suggestPostMediaContextSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'AUDIO']),
  fileName: z.string().trim().max(255).optional(),
  alt: z.string().trim().max(255).optional(),
  duration: z.number().nonnegative().max(3600).optional(),
});

export const suggestPostContentSchema = z
  .object({
    topic: z.string().trim().max(2000, 'Ý chính tối đa 2.000 ký tự').optional(),
    currentContent: z
      .string()
      .trim()
      .max(5000, 'Nội dung hiện tại tối đa 5.000 ký tự')
      .optional(),
    tone: z.enum(['FRIENDLY', 'FUNNY', 'PROFESSIONAL', 'INSPIRING', 'CONCISE'], {
      message: 'Giọng điệu không hợp lệ',
    }),
    visibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
    taggedUserNames: z.array(z.string().trim().max(120)).max(20).optional(),
    mediaItems: z.array(suggestPostMediaContextSchema).max(8).optional(),
    mediaFiles: z.array(z.custom<File>()).max(8).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.topic?.length ||
          data.currentContent?.length ||
          data.mediaItems?.length ||
          data.mediaFiles?.length ||
          data.taggedUserNames?.length,
      ),
    {
      message:
        'Vui lòng nhập ý chính, viết vài dòng hoặc đính kèm ảnh/video/ghi âm để AI gợi ý',
      path: ['topic'],
    },
  );

export type SuggestPostContentFormValues = z.infer<typeof suggestPostContentSchema>;

export const MODERATION_REASON_PRESETS: readonly string[] = [
  'Nội dung spam, quảng cáo hoặc bán hàng trái quy định cộng đồng',
  'Ngôn từ công kích cá nhân, gây thù ghét hoặc thiếu văn minh',
  'Chia sẻ thông tin sai sự thật, gây hoang mang cộng đồng',
  'Nội dung nhạy cảm hoặc xâm phạm quyền riêng tư của người khác',
] as const;

export const hidePostModerationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập lý do ẩn bài viết tối thiểu 5 ký tự')
    .max(500, 'Lý do ẩn bài viết tối đa 500 ký tự'),
});

export type HidePostModerationFormValues = z.infer<typeof hidePostModerationSchema>;

export const removeModerationReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Lý do gỡ bỏ tối đa 500 ký tự')
    .optional(),
});

export type RemoveModerationReasonFormValues = z.infer<typeof removeModerationReasonSchema>;

export const POST_APPEAL_REASON_OPTIONS = [
  {
    key: 'MISUNDERSTOOD_CONTEXT',
    label: 'Nội dung bị hiểu nhầm ngữ cảnh',
    description:
      'Bài viết mang tính chia sẻ trải nghiệm, thảo luận lành mạnh hoặc trích dẫn thông tin không nhằm công kích hay vi phạm.',
  },
  {
    key: 'NOT_VIOLATION',
    label: 'Bài viết tuân thủ tiêu chuẩn cộng đồng',
    description:
      'Tôi đã rà soát lại nội dung và hình ảnh đính kèm, bài viết không vi phạm quy định của Lyora.',
  },
  {
    key: 'EDITED_OR_CLARIFIED',
    label: 'Thông tin chính xác và có nguồn rõ ràng',
    description:
      'Nội dung bài viết dựa trên thông tin xác thực, không gây hiểu nhầm hoặc ảnh hưởng tiêu cực tới cộng đồng.',
  },
  {
    key: 'SYSTEM_MISTAKE',
    label: 'Nhầm lẫn trong quá trình kiểm duyệt',
    description:
      'Tôi cho rằng bài viết bị ẩn do nhầm lẫn kỹ thuật hoặc báo cáo sai từ người dùng khác.',
  },
  {
    key: 'OTHER',
    label: 'Khác',
    description: 'Tự nhập mô tả lý do khiếu nại cụ thể của bạn.',
  },
] as const;

export type PostAppealReasonKey =
  (typeof POST_APPEAL_REASON_OPTIONS)[number]['key'];

export const createPostAppealFormSchema = z
  .object({
    reasonKey: z.enum([
      'MISUNDERSTOOD_CONTEXT',
      'NOT_VIOLATION',
      'EDITED_OR_CLARIFIED',
      'SYSTEM_MISTAKE',
      'OTHER',
    ]),
    detail: z.string().trim().max(1000, 'Nội dung khiếu nại tối đa 1000 ký tự').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonKey === 'OTHER') {
      const len = (data.detail ?? '').trim().length;
      if (len < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['detail'],
          message: 'Vui lòng nhập nội dung khiếu nại cụ thể tối thiểu 10 ký tự',
        });
      }
    }
  });

export function buildFinalPostAppealPayload(
  reasonKey: PostAppealReasonKey,
  detail?: string,
): { reasonCategory: string; reasonDetail: string } {
  const matched =
    POST_APPEAL_REASON_OPTIONS.find((opt) => opt.key === reasonKey) ??
    POST_APPEAL_REASON_OPTIONS[0];
  if (reasonKey === 'OTHER') {
    return {
      reasonCategory: matched.label,
      reasonDetail: (detail ?? '').trim(),
    };
  }
  const extra = (detail ?? '').trim();
  return {
    reasonCategory: matched.label,
    reasonDetail: extra ? `${matched.description} (${extra})` : matched.description,
  };
}

export const rejectPostAppealSchema = z.object({
  evidence: z
    .string()
    .trim()
    .min(10, 'Vui lòng nhập minh chứng cụ thể tối thiểu 10 ký tự')
    .max(1000, 'Minh chứng tối đa 1000 ký tự'),
});
