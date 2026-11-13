import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/authenticated-user.interface';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  ResetPasswordDto,
  VerifyForgotPasswordOtpDto,
} from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async sendRegisterOtp(
    dto: SendOtpDto,
  ): Promise<{ email: string; cooldownSeconds: number }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email này đã được đăng ký trong hệ thống');
    }

    return this.issueAndSendOtp('register', normalizedEmail, 'REGISTER');
  }

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const storedOtp = await this.redisService.getOtp(
      'register',
      normalizedEmail,
    );
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException(
        'Mã xác thực OTP không chính xác hoặc đã hết hạn',
      );
    }

    await this.redisService.delOtp('register', normalizedEmail);

    const user = await this.usersService.createUser({
      email: normalizedEmail,
      password: dto.password,
      fullName: dto.fullName,
      role: UserRole.CLIENT,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.issueTokens(user);
  }

  async sendForgotPasswordOtp(
    dto: SendOtpDto,
  ): Promise<{ email: string; cooldownSeconds: number }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy tài khoản với địa chỉ email này',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên',
      );
    }

    return this.issueAndSendOtp(
      'forgot-password',
      normalizedEmail,
      'FORGOT_PASSWORD',
    );
  }

  private async issueAndSendOtp(
    action: 'register' | 'forgot-password',
    normalizedEmail: string,
    purpose: 'REGISTER' | 'FORGOT_PASSWORD',
  ): Promise<{ email: string; cooldownSeconds: number }> {
    const isCooldown = await this.redisService.isOtpInCooldown(
      action,
      normalizedEmail,
    );
    if (isCooldown) {
      throw new BadRequestException(
        'Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã OTP',
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    await this.redisService.setOtp(action, normalizedEmail, otp);

    try {
      await this.mailService.sendOtpEmail(normalizedEmail, otp, purpose);
    } catch (err) {
      await Promise.all([
        this.redisService.delOtp(action, normalizedEmail),
        this.redisService.delOtpCooldown(action, normalizedEmail),
      ]);
      this.logger.error(
        `Failed to send ${purpose} OTP email to ${normalizedEmail}: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.',
      );
    }

    return {
      email: normalizedEmail,
      cooldownSeconds: REDIS_TTL.OTP_COOLDOWN_SECONDS,
    };
  }

  async verifyForgotPasswordOtp(
    dto: VerifyForgotPasswordOtpDto,
  ): Promise<{ resetToken: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const storedOtp = await this.redisService.getOtp(
      'forgot-password',
      normalizedEmail,
    );
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException(
        'Mã xác thực OTP không chính xác hoặc đã hết hạn',
      );
    }

    await this.redisService.delOtp('forgot-password', normalizedEmail);

    const resetToken = randomUUID();
    await this.redisService.setResetToken(normalizedEmail, resetToken);

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const storedToken = await this.redisService.getResetToken(normalizedEmail);
    if (!storedToken || storedToken !== dto.resetToken) {
      throw new BadRequestException(
        'Mã xác thực đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }

    await this.usersService.updatePassword(user.id, dto.newPassword);
    await this.redisService.delResetToken(normalizedEmail);

    return { success: true };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokenResponse> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException('Phiên làm việc không hợp lệ');
    }

    const storedRefreshToken = await this.redisService.getSession(
      payload.sub,
      payload.sessionId,
    );
    if (!storedRefreshToken || storedRefreshToken !== dto.refreshToken) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã bị thu hồi hoặc hết hạn',
      );
    }

    await this.redisService.revokeSession(payload.sub, payload.sessionId);
    const user = await this.usersService.findById(payload.sub);

    return this.issueTokens(user);
  }

  async logout(
    userId: string,
    accessToken?: string,
    sessionId?: string,
  ): Promise<{ loggedOut: boolean }> {
    const tasks: Array<Promise<void>> = [];

    if (accessToken) {
      const decoded = this.jwtService.decode<JwtPayload>(accessToken);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const remainingTtl =
        decoded && decoded.exp
          ? Math.max(1, decoded.exp - nowSeconds)
          : REDIS_TTL.DEFAULT_ACCESS_TOKEN_SECONDS;

      tasks.push(this.redisService.blacklistToken(accessToken, remainingTtl));
    }

    if (sessionId) {
      tasks.push(this.redisService.revokeSession(userId, sessionId));
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }

    return { loggedOut: true };
  }

  async getProfile(userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  private async issueTokens(user: User): Promise<AuthTokenResponse> {
    const sessionId = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: REDIS_TTL.DEFAULT_ACCESS_TOKEN_SECONDS,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: REDIS_TTL.DEFAULT_REFRESH_TOKEN_SECONDS,
      }),
    ]);

    await this.redisService.saveSession(
      user.id,
      sessionId,
      refreshToken,
      REDIS_TTL.DEFAULT_REFRESH_TOKEN_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
