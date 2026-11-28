import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { UserRole } from '../../common/enums/role.enum';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService Security & OTP Guards', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      | 'findByEmail'
      | 'createUser'
      | 'updatePassword'
      | 'findById'
      | 'updateProfile'
      | 'setOnlineStatus'
    >
  >;
  let redisService: jest.Mocked<
    Pick<
      RedisService,
      | 'getOtp'
      | 'delOtp'
      | 'incrementOtpAttempts'
      | 'getResetToken'
      | 'delResetToken'
      | 'setResetToken'
      | 'revokeAllUserSessions'
      | 'saveSession'
    >
  >;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      updatePassword: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      setOnlineStatus: jest.fn().mockResolvedValue(undefined),
    };

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
    } as unknown as JwtService;

    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    redisService = {
      getOtp: jest.fn(),
      delOtp: jest.fn().mockResolvedValue(undefined),
      incrementOtpAttempts: jest.fn(),
      getResetToken: jest.fn(),
      delResetToken: jest.fn().mockResolvedValue(undefined),
      setResetToken: jest.fn().mockResolvedValue(undefined),
      revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
      saveSession: jest.fn().mockResolvedValue(undefined),
    };

    const mailService = {
      sendOtpEmail: jest.fn(),
    } as unknown as MailService;

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
      configService,
      redisService as unknown as RedisService,
      mailService,
    );
  });

  it('invalidates OTP after reaching MAX_OTP_ATTEMPTS on failed verification', async () => {
    redisService.getOtp.mockResolvedValue('123456');
    redisService.incrementOtpAttempts.mockResolvedValue(
      REDIS_TTL.MAX_OTP_ATTEMPTS,
    );

    await expect(
      authService.verifyForgotPasswordOtp({
        email: 'user@lyora.com',
        otp: '000000',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(redisService.incrementOtpAttempts).toHaveBeenCalledWith(
      'forgot-password',
      'user@lyora.com',
    );
    expect(redisService.delOtp).toHaveBeenCalledWith(
      'forgot-password',
      'user@lyora.com',
    );
  });

  it('preserves registration OTP if user creation fails', async () => {
    redisService.getOtp.mockResolvedValue('654321');
    usersService.createUser.mockRejectedValue(new Error('DB transient error'));

    await expect(
      authService.register({
        email: 'new@lyora.com',
        password: 'password123',
        fullName: 'Test User',
        otp: '654321',
      }),
    ).rejects.toThrow('DB transient error');

    expect(redisService.delOtp).not.toHaveBeenCalled();
  });

  it('revokes all active user sessions after password reset', async () => {
    redisService.getResetToken.mockResolvedValue('valid-reset-token');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@lyora.com',
      fullName: 'Test User',
      role: UserRole.CLIENT,
      isActive: true,
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.resetPassword({
      email: 'user@lyora.com',
      resetToken: 'valid-reset-token',
      newPassword: 'newPassword123',
    });

    expect(result).toEqual({ success: true });
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      'newPassword123',
    );
    expect(redisService.delResetToken).toHaveBeenCalledWith('user@lyora.com');
    expect(redisService.revokeAllUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('delegates profile update with phoneNumber, bio and location to UsersService', async () => {
    const updatedUser = {
      id: 'user-1',
      email: 'user@lyora.com',
      fullName: 'Người Dùng Mới',
      role: UserRole.CLIENT,
      isActive: true,
      phoneNumber: '0908123456',
      bio: 'Giới thiệu cá nhân',
      location: 'TP. Hồ Chí Minh',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.updateProfile.mockResolvedValue(updatedUser);

    const res = await authService.updateProfile('user-1', {
      fullName: 'Người Dùng Mới',
      phoneNumber: '0908123456',
      bio: 'Giới thiệu cá nhân',
      location: 'TP. Hồ Chí Minh',
    });

    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
      fullName: 'Người Dùng Mới',
      phoneNumber: '0908123456',
      bio: 'Giới thiệu cá nhân',
      location: 'TP. Hồ Chí Minh',
    });
    expect(res.phoneNumber).toBe('0908123456');
  });

  it('throws ForbiddenException with ACCOUNT_LOCKED and lockReason details when locked user logs in', async () => {
    const lockedAt = new Date('2026-11-27T09:00:00.000Z');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-locked',
      email: 'locked@lyora.com',
      fullName: 'Locked User',
      role: UserRole.CLIENT,
      isActive: false,
      isOnline: false,
      lockReason: 'Tài khoản vi phạm quy định cộng đồng',
      lockedAt,
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await authService.login({
        email: 'locked@lyora.com',
        password: 'password123',
      });
      throw new Error('Expected ForbiddenException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as {
        code?: string;
        details?: { lockReason?: string; lockedAt?: string | null };
      };
      expect(response.code).toBe('ACCOUNT_LOCKED');
      expect(response.details?.lockReason).toBe(
        'Tài khoản vi phạm quy định cộng đồng',
      );
      expect(response.details?.lockedAt).toBe(lockedAt.toISOString());
    }
  });

  it('marks user online on login and offline on logout', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-active',
      email: 'active@lyora.com',
      fullName: 'Active User',
      role: UserRole.CLIENT,
      isActive: true,
      isOnline: false,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const loginRes = await authService.login({
      email: 'active@lyora.com',
      password: 'password123',
    });

    expect(usersService.setOnlineStatus).toHaveBeenCalledWith(
      'user-active',
      true,
    );
    expect(loginRes.user.isOnline).toBe(true);

    const logoutRes = await authService.logout('user-active');
    expect(usersService.setOnlineStatus).toHaveBeenCalledWith(
      'user-active',
      false,
    );
    expect(logoutRes).toEqual({ loggedOut: true });
  });
});
