import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import {
  ResetPasswordDto,
  VerifyForgotPasswordOtpDto,
} from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/send-otp')
  @ResponseMessage('Mã xác thực OTP đã được gửi đến email của bạn')
  async sendRegisterOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendRegisterOtp(dto);
  }

  @Public()
  @Post('register')
  @ResponseMessage('Đăng ký tài khoản thành công')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ResponseMessage('Đăng nhập thành công')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password/send-otp')
  @ResponseMessage('Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn')
  async sendForgotPasswordOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendForgotPasswordOtp(dto);
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @ResponseMessage('Xác thực mã OTP thành công')
  async verifyForgotPasswordOtp(@Body() dto: VerifyForgotPasswordOtpDto) {
    return this.authService.verifyForgotPasswordOtp(dto);
  }

  @Public()
  @Post('forgot-password/reset')
  @ResponseMessage('Đặt lại mật khẩu thành công')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  @ResponseMessage('Làm mới phiên đăng nhập thành công')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @ResponseMessage('Đăng xuất thành công')
  async logout(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    return this.authService.logout(user.id, accessToken, user.sessionId);
  }

  @Get('me')
  @ResponseMessage('Lấy thông tin tài khoản thành công')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
