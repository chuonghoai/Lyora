import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PostMediaType } from '../enums/post.enums';
import { PostMediaItem } from '../interfaces/post-media.interface';
import { CloudinaryService } from './cloudinary.service';

export const MAX_UPLOAD_FILES = 8;
export const MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
]);

export function normalizeMimeType(mimetype: string): string {
  return mimetype.split(';')[0].trim().toLowerCase();
}

export function isAllowedMimeType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.has(normalizeMimeType(mimetype));
}

function resolveMediaType(mimetype: string): PostMediaType {
  if (mimetype.startsWith('image/')) return PostMediaType.IMAGE;
  if (mimetype.startsWith('audio/')) return PostMediaType.AUDIO;
  return PostMediaType.VIDEO;
}

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFiles(files: Express.Multer.File[]): Promise<PostMediaItem[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp để tải lên');
    }
    if (files.length > MAX_UPLOAD_FILES) {
      throw new BadRequestException(
        `Mỗi lần chỉ được tải lên tối đa ${MAX_UPLOAD_FILES} tệp`,
      );
    }

    if (!this.cloudinaryService.isConfigured) {
      this.logger.error(
        'Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
      );
      throw new BadRequestException(
        'Dịch vụ lưu trữ phương tiện chưa sẵn sàng. Vui lòng thử lại sau.',
      );
    }

    return Promise.all(files.map((file) => this.uploadSingle(file)));
  }

  // Stream file trực tiếp lên Cloudinary
  private async uploadSingle(
    file: Express.Multer.File,
  ): Promise<PostMediaItem> {
    const mimetype = normalizeMimeType(file.mimetype);
    const normalizedFile = { ...file, mimetype };

    const result = await this.cloudinaryService.uploadStream(normalizedFile);

    return {
      id: result.publicId,
      url: result.url,
      type: resolveMediaType(mimetype),
      duration: result.duration,
      fileName: file.originalname,
      size: result.size ?? file.size,
    };
  }
}
