import { describe, it, expect } from 'vitest';
import {
  forgotPasswordEmailSchema,
  loginSchema,
  otpSchema,
  registerStep1Schema,
  resetPasswordSchema,
} from '@/features/auth';

describe('Auth Schemas Validation', () => {
  describe('loginSchema', () => {
    it('should accept valid credentials', () => {
      const validData = {
        email: 'user@lyora.com',
        password: 'securePassword123',
        rememberMe: true,
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@lyora.com');
        expect(result.data.rememberMe).toBe(true);
      }
    });

    it('should trim whitespace from email', () => {
      const result = loginSchema.safeParse({
        email: '  admin@lyora.com  ',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin@lyora.com');
      }
    });

    it('should reject empty email with correct message', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'));
        expect(emailError?.message).toBe('Email không được để trống');
      }
    });

    it('should reject invalid email format with correct message', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email-format',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'));
        expect(emailError?.message).toBe('Định dạng email không hợp lệ');
      }
    });

    it('should reject short password (< 6 characters) with correct message', () => {
      const result = loginSchema.safeParse({
        email: 'user@lyora.com',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toBe('Mật khẩu phải có ít nhất 6 ký tự');
      }
    });
  });

  describe('registerStep1Schema', () => {
    it('should accept valid register data', () => {
      const result = registerStep1Schema.safeParse({
        fullName: 'Nguyễn Văn A',
        email: 'a@lyora.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched confirmPassword', () => {
      const result = registerStep1Schema.safeParse({
        fullName: 'Nguyễn Văn A',
        email: 'a@lyora.com',
        password: 'password123',
        confirmPassword: 'differentPassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmErr = result.error.issues.find((i) =>
          i.path.includes('confirmPassword'),
        );
        expect(confirmErr?.message).toBe('Mật khẩu xác nhận không khớp');
      }
    });
  });

  describe('otpSchema', () => {
    it('should accept 6-digit numeric string', () => {
      const result = otpSchema.safeParse({ otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('should reject non-digit or wrong length otp', () => {
      expect(otpSchema.safeParse({ otp: '12345' }).success).toBe(false);
      expect(otpSchema.safeParse({ otp: '1234567' }).success).toBe(false);
      expect(otpSchema.safeParse({ otp: 'abcdef' }).success).toBe(false);
    });
  });

  describe('forgotPasswordEmailSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordEmailSchema.safeParse({ email: 'user@lyora.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordEmailSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept matching passwords with at least 6 characters', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'newSecretPassword123',
        confirmPassword: 'newSecretPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'newSecretPassword123',
        confirmPassword: 'notTheSamePassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmErr = result.error.issues.find((i) =>
          i.path.includes('confirmPassword'),
        );
        expect(confirmErr?.message).toBe('Mật khẩu xác nhận không khớp');
      }
    });
  });
});
