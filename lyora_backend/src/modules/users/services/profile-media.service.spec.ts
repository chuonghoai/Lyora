import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';
import {
  MAX_PROFILE_IMAGE_SIZE,
  ProfileMediaService,
} from './profile-media.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('ProfileMediaService', () => {
  const createConfigService = (configured: boolean) =>
    ({
      get: jest.fn((key: string) => {
        if (!configured) return undefined;
        if (key === 'cloudinary.cloudName') return 'demo-cloud';
        if (key === 'cloudinary.apiKey') return 'demo-key';
        if (key === 'cloudinary.apiSecret') return 'demo-secret';
        return undefined;
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing file, invalid MIME type, and oversized files', async () => {
    const service = new ProfileMediaService(createConfigService(true));

    await expect(service.uploadProfileImage(undefined)).rejects.toThrow(
      BadRequestException,
    );

    await expect(
      service.uploadProfileImage({
        originalname: 'notes.txt',
        mimetype: 'text/plain',
        size: 120,
        buffer: Buffer.from('hello'),
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.uploadProfileImage({
        originalname: 'big.png',
        mimetype: 'image/png',
        size: MAX_PROFILE_IMAGE_SIZE + 1,
        buffer: Buffer.from('x'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ServiceUnavailableException when Cloudinary is not configured', async () => {
    const service = new ProfileMediaService(createConfigService(false));

    await expect(
      service.uploadProfileImage({
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('img'),
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('streams valid profile image to lyora/profiles folder on Cloudinary', async () => {
    const service = new ProfileMediaService(createConfigService(true));

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        cb: (err: Error | null, res?: Record<string, unknown>) => void,
      ) => {
        const stream = new PassThrough();
        stream.on('finish', () => {
          cb(null, {
            secure_url:
              'https://res.cloudinary.com/demo-cloud/image/upload/lyora/profiles/avatar.webp',
            public_id: 'lyora/profiles/avatar',
            format: 'webp',
            bytes: 2048,
          });
        });
        return stream;
      },
    );

    const result = await service.uploadProfileImage({
      originalname: 'avatar.webp',
      mimetype: 'image/webp',
      size: 2048,
      buffer: Buffer.from('fake-webp-bytes'),
    });

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'lyora/profiles', resource_type: 'image' },
      expect.any(Function),
    );
    expect(result).toEqual({
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/lyora/profiles/avatar.webp',
      publicId: 'lyora/profiles/avatar',
      format: 'webp',
      size: 2048,
    });
  });
});
