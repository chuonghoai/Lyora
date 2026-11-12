import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { REDIS_TTL } from '../../common/constants/redis-keys.constant';
import { UserRole } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/authenticated-user.interface';
import { RedisService } from '../../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

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
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.createUser({
      email: dto.email,
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
    if (accessToken) {
      const decoded = this.jwtService.decode<JwtPayload>(accessToken);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const remainingTtl =
        decoded && decoded.exp
          ? Math.max(1, decoded.exp - nowSeconds)
          : REDIS_TTL.DEFAULT_ACCESS_TOKEN_SECONDS;

      await this.redisService.blacklistToken(accessToken, remainingTtl);
    }

    if (sessionId) {
      await this.redisService.revokeSession(userId, sessionId);
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
