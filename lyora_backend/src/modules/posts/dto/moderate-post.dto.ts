import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class HidePostModerationDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Lý do ẩn bài viết phải là chuỗi ký tự' })
  @MinLength(5, {
    message: 'Vui lòng nhập lý do ẩn bài viết tối thiểu 5 ký tự',
  })
  @MaxLength(500, { message: 'Lý do ẩn bài viết tối đa 500 ký tự' })
  reason: string;
}

export class RemoveModerationReasonDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Lý do gỡ bỏ phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Lý do gỡ bỏ tối đa 500 ký tự' })
  reason?: string;
}
