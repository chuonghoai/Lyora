import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidWebsiteUrl', async: false })
export class IsValidWebsiteUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return true;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
      return false;
    }
    try {
      const candidate = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(candidate);
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        Boolean(parsed.hostname && parsed.hostname.includes('.'))
      );
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Liên kết cá nhân chưa đúng định dạng (ví dụ: https://lyora.vn)';
  }
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(150, { message: 'Họ và tên tối đa 150 ký tự' })
  fullName?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9+\-\s().]{8,20}$/, {
    message: 'Số điện thoại không đúng định dạng (8–20 ký tự)',
  })
  phoneNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Giới thiệu bản thân phải là chuỗi ký tự' })
  @MaxLength(300, { message: 'Giới thiệu bản thân tối đa 300 ký tự' })
  bio?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Địa điểm phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Địa điểm tối đa 120 ký tự' })
  location?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Quê quán phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Quê quán tối đa 120 ký tự' })
  hometown?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Công việc phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Công việc / Nơi làm việc tối đa 120 ký tự' })
  workplace?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Học vấn phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Học vấn tối đa 120 ký tự' })
  education?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString({ message: 'Liên kết cá nhân phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Liên kết cá nhân tối đa 200 ký tự' })
  @Validate(IsValidWebsiteUrlConstraint)
  website?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString({ message: 'Đường dẫn ảnh đại diện phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Đường dẫn ảnh đại diện tối đa 500 ký tự' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Đường dẫn ảnh đại diện phải là URL hợp lệ (http/https)' },
  )
  avatarUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString({ message: 'Đường dẫn ảnh bìa phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Đường dẫn ảnh bìa tối đa 500 ký tự' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Đường dẫn ảnh bìa phải là URL hợp lệ (http/https)' },
  )
  coverUrl?: string | null;
}
