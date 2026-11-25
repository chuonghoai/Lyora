import { z } from 'zod';

const PHONE_PATTERN = /^[0-9+\-\s().]{8,20}$/;

function isValidOptionalUrl(value: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export const updateExtendedProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
    .max(150, 'Họ và tên tối đa 150 ký tự.'),
  phoneNumber: z
    .string()
    .trim()
    .refine((val) => val === '' || PHONE_PATTERN.test(val), {
      message: 'Số điện thoại không đúng định dạng (8–20 ký tự).',
    })
    .optional(),
  bio: z
    .string()
    .trim()
    .max(300, 'Giới thiệu bản thân tối đa 300 ký tự.')
    .optional(),
  location: z
    .string()
    .trim()
    .max(120, 'Khu vực hiện tại tối đa 120 ký tự.')
    .optional(),
  hometown: z
    .string()
    .trim()
    .max(120, 'Quê quán tối đa 120 ký tự.')
    .optional(),
  workplace: z
    .string()
    .trim()
    .max(120, 'Công việc / Nơi làm việc tối đa 120 ký tự.')
    .optional(),
  education: z
    .string()
    .trim()
    .max(120, 'Học vấn tối đa 120 ký tự.')
    .optional(),
  website: z
    .string()
    .trim()
    .max(200, 'Liên kết cá nhân tối đa 200 ký tự.')
    .refine(isValidOptionalUrl, {
      message: 'Liên kết cá nhân chưa đúng định dạng (ví dụ: https://lyora.vn).',
    })
    .optional(),
});

export type UpdateExtendedProfileFormValues = z.infer<typeof updateExtendedProfileSchema>;
