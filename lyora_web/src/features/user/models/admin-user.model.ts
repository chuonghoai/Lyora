import { z } from 'zod';

export const LOCK_ACCOUNT_REASONS = [
  {
    key: 'SPAM_OR_SCAM',
    label: 'Phát tán spam, lừa đảo hoặc nội dung giả mạo',
    description: 'Đăng tải liên kết lừa đảo, tin rác lặp lại hoặc mạo danh cá nhân/tổ chức.',
  },
  {
    key: 'HARASSMENT',
    label: 'Quấy rối, xúc phạm hoặc đe dọa thành viên khác',
    description: 'Sử dụng ngôn từ công kích, bắt nạt hoặc gây ảnh hưởng tiêu cực tới người dùng khác.',
  },
  {
    key: 'INAPPROPRIATE_CONTENT',
    label: 'Đăng tải hình ảnh hoặc nội dung phản cảm',
    description: 'Nội dung vi phạm thuần phong mỹ tục, bạo lực hoặc không phù hợp tiêu chuẩn cộng đồng.',
  },
  {
    key: 'POLICY_VIOLATION',
    label: 'Vi phạm nghiêm trọng điều khoản sử dụng Lyora',
    description: 'Can thiệp trái phép, khai thác lỗ hổng hoặc tái phạm nhiều lần sau nhắc nhở.',
  },
  {
    key: 'COMPROMISED_ACCOUNT',
    label: 'Tài khoản có dấu hiệu bị chiếm quyền hoặc bất thường',
    description: 'Phát hiện truy cập đáng ngờ, cần tạm khóa để bảo vệ an toàn cho chủ tài khoản.',
  },
  {
    key: 'OTHER',
    label: 'Khác',
    description: 'Trường hợp khác — quản trị viên ghi rõ lý do cụ thể bên dưới.',
  },
] as const;

export type LockAccountReasonKey = (typeof LOCK_ACCOUNT_REASONS)[number]['key'];

const reasonKeys = LOCK_ACCOUNT_REASONS.map((item) => item.key) as [
  LockAccountReasonKey,
  ...LockAccountReasonKey[],
];

export const lockUserFormSchema = z
  .object({
    reasonKey: z.enum(reasonKeys, {
      message: 'Vui lòng chọn lý do khóa tài khoản',
    }),
    detail: z
      .string()
      .trim()
      .max(400, 'Mô tả chi tiết lý do không được vượt quá 400 ký tự')
      .optional()
      .default(''),
  })
  .superRefine((data, ctx) => {
    if (data.reasonKey === 'OTHER' && data.detail.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng mô tả rõ lý do khóa tài khoản (tối thiểu 10 ký tự)',
        path: ['detail'],
      });
    }
  });

export type LockUserFormValues = z.infer<typeof lockUserFormSchema>;

export function buildFinalLockReason(
  reasonKey: LockAccountReasonKey,
  detail: string = '',
): string {
  const trimmedDetail = detail.trim();
  const matched = LOCK_ACCOUNT_REASONS.find((item) => item.key === reasonKey);
  if (!matched || reasonKey === 'OTHER') {
    return trimmedDetail.slice(0, 500);
  }
  return matched.label.slice(0, 500);
}

export const ADMIN_USER_ROLE_OPTIONS = [
  {
    value: 'CLIENT',
    label: 'Người dùng',
    description: 'Tài khoản thành viên cộng đồng tiêu chuẩn (đăng bài, bình luận, nhắn tin).',
  },
  {
    value: 'ADMIN',
    label: 'Quản trị',
    description: 'Tài khoản quản trị viên có toàn quyền truy cập Trung Tâm Quản Trị.',
  },
] as const;

export const createAdminUserFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Họ và tên không được để trống')
      .max(150, 'Họ và tên không được vượt quá 150 ký tự'),
    email: z
      .string()
      .trim()
      .min(1, 'Email không được để trống')
      .email('Định dạng email không hợp lệ')
      .max(255, 'Email không được vượt quá 255 ký tự'),
    password: z
      .string()
      .min(1, 'Mật khẩu không được để trống')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(128, 'Mật khẩu không được vượt quá 128 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    role: z.enum(['CLIENT', 'ADMIN'], {
      message: 'Vui lòng chọn vai trò hợp lệ',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type CreateAdminUserFormValues = z.infer<typeof createAdminUserFormSchema>;
