import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerStep1Schema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Họ và tên không được để trống'),
    email: z
      .string()
      .trim()
      .min(1, 'Email không được để trống')
      .email('Định dạng email không hợp lệ'),
    password: z
      .string()
      .min(1, 'Mật khẩu không được để trống')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, 'Mã OTP không được để trống')
    .regex(/^\d{6}$/, 'Mã OTP phải bao gồm đúng 6 chữ số'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ'),
});

export type ForgotPasswordEmailFormData = z.infer<
  typeof forgotPasswordEmailSchema
>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Mật khẩu mới không được để trống')
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
