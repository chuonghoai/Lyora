import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CloudinaryResponse } from '../interfaces/post-media.interface';

@Injectable()
export class CloudinaryService {
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

  // Stream buffer lên Cloudinary; âm thanh dùng resource_type 'video'
  uploadStream(
    file: Express.Multer.File,
    folder: string = 'lyora/posts',
  ): Promise<CloudinaryResponse> {
    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';

    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(
              new BadGatewayException(
                'Không thể tải tệp lên dịch vụ lưu trữ. Vui lòng thử lại sau',
              ),
            );
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            duration:
              typeof result.duration === 'number' ? result.duration : undefined,
            format: result.format,
            size: result.bytes,
          });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
