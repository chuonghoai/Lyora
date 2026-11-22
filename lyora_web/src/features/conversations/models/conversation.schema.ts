import { z } from 'zod';

export const createDirectConversationSchema = z.object({
  targetUserId: z
    .string()
    .trim()
    .min(1, 'targetUserId không được để trống')
    .uuid('ID người dùng không đúng định dạng UUID'),
});

export type CreateDirectConversationFormValues = z.infer<
  typeof createDirectConversationSchema
>;

export const createGroupConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Tên nhóm phải có ít nhất 2 ký tự')
    .max(100, 'Tên nhóm tối đa 100 ký tự'),
  memberIds: z
    .array(z.string().uuid('ID thành viên không đúng định dạng UUID'))
    .min(2, 'Hội thoại nhóm cần tối thiểu 2 người bạn')
    .max(99, 'Hội thoại nhóm tối đa 99 người bạn')
    .refine((items) => new Set(items).size === items.length, {
      message: 'Danh sách thành viên không được chứa ID trùng lặp',
    }),
});

export type CreateGroupConversationFormValues = z.infer<
  typeof createGroupConversationSchema
>;
