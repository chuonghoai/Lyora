import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { ProfileMediaUploadResponseDto } from '../dto/public-profile-response.dto';

export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_PROFILE_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function normalizeProfileImageMime(mimetype: string): string {
  return mimetype.split(';')[0].trim().toLowerCase();
}

export function isAllowedProfileImageMime(mimetype: string): boolean {
  return ALLOWED_PROFILE_IMAGE_MIMES.has(normalizeProfileImageMime(mimetype));
}

@Injectable()
export class ProfileMediaService {
  private readonly logger = new Logger(ProfileMediaService.name);
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  async uploadProfileImage(
    file: Express.Multer.File | undefined,
  ): Promise<ProfileMediaUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp ảnh để tải lên');
    }

    const mimetype = normalizeProfileImageMime(file.mimetype || '');
    if (!isAllowedProfileImageMime(mimetype)) {
      throw new BadRequestException(
        'Chỉ hỗ trợ tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF',
      );
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      throw new BadRequestException('Dung lượng ảnh tối đa là 5MB');
    }

    if (!this.configured) {
      this.logger.error(
        'Cloudinary chưa được cấu hình. Kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
      throw new ServiceUnavailableException(
        'Dịch vụ lưu trữ ảnh hồ sơ chưa sẵn sàng. Vui lòng thử lại sau.',
      );
    }

    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'lyora/profiles', resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(
              new Error(error?.message ?? 'Cloudinary không trả về kết quả'),
            );
            return;
          }
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      format: uploaded.format,
      size: uploaded.bytes ?? file.size,
    };
  }
}
