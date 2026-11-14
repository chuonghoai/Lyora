import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const secure = this.configService.get<boolean>('mail.secure');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        host,
        port,
        secure,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  onModuleInit(): void {
    if (!this.transporter) return;
    void this.transporter.verify().catch((err: Error) => {
      this.logger.warn(`SMTP warm-up verify failed: ${err.message}`);
    });
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    purpose: 'REGISTER' | 'FORGOT_PASSWORD',
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Hệ thống gửi thư điện tử chưa được cấu hình');
    }

    const from = this.configService.get<string>('mail.from');
    const isRegister = purpose === 'REGISTER';
    const subject = isRegister
      ? '[Lyora] Mã xác thực đăng ký tài khoản'
      : '[Lyora] Mã xác thực đặt lại mật khẩu';

    const actionText = isRegister
      ? 'hoàn tất đăng ký tài khoản trên mạng xã hội Lyora'
      : 'yêu cầu đặt lại mật khẩu tài khoản Lyora của bạn';

    const html = `
      <div style="font-family: 'Be Vietnam Pro', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563EB; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Lyora</h1>
          <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Cộng đồng số — Đăng bài, Chia sẻ &amp; Nhắn tin</p>
        </div>
        <div style="padding: 20px 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB;">
          <p style="color: #111827; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Xin chào,</p>
          <p style="color: #111827; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Bạn nhận được email này vì đã có yêu cầu ${actionText}. Vui lòng nhập mã xác thực OTP bên dưới để tiếp tục:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563EB; background-color: #DBEAFE; padding: 12px 28px; border-radius: 8px; border: 1px dashed #93C5FD;">
              ${otp}
            </div>
          </div>
          <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
            Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
          </p>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ bộ phận hỗ trợ Lyora.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}
