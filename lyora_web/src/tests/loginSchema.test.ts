import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/features/auth';

describe('loginSchema Validation', () => {
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
      expect(emailError).toBeDefined();
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
      expect(emailError).toBeDefined();
      expect(emailError?.message).toBe('Định dạng email không hợp lệ');
    }
  });

  it('should reject empty password with correct message', () => {
    const result = loginSchema.safeParse({
      email: 'user@lyora.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path.includes('password'));
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toBe('Mật khẩu không được để trống');
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
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toBe('Mật khẩu phải có ít nhất 6 ký tự');
    }
  });
});
