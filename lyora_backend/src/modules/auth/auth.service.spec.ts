import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
      'findByEmail' | 'createUser' | 'updatePassword' | 'findById'
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
});
