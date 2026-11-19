import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PostMediaType, PostVisibility } from '../enums/post.enums';

// Chỉ chấp nhận URL Cloudinary do hệ thống upload trả về
const TRUSTED_MEDIA_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/[\w\-./%]+$/;

export class PostMediaItemDto {
  @IsString({ message: 'Mã phương tiện phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Mã phương tiện tối đa 120 ký tự' })
  id: string;

  @IsEnum(PostMediaType, { message: 'Loại phương tiện không hợp lệ' })
  type: PostMediaType;

  @IsString({ message: 'Đường dẫn phương tiện phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Đường dẫn phương tiện tối đa 500 ký tự' })
  @Matches(TRUSTED_MEDIA_URL_PATTERN, {
    message: 'Đường dẫn phương tiện không hợp lệ',
  })
  url: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phương tiện phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Mô tả phương tiện tối đa 255 ký tự' })
  alt?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Thời lượng phải là số' })
  @Min(0)
  @Max(3600)
  duration?: number;

  @IsOptional()
  @IsString({ message: 'Tên tệp phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Tên tệp tối đa 255 ký tự' })
  fileName?: string;

  @IsOptional()
  @IsInt({ message: 'Dung lượng phải là số nguyên' })
  @Min(0)
  size?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString({ message: 'Nội dung bài viết phải là chuỗi ký tự' })
  @MaxLength(5000, { message: 'Nội dung bài viết tối đa 5.000 ký tự' })
  content?: string;

  @IsOptional()
  @IsEnum(PostVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: PostVisibility;

  @IsOptional()
  @IsArray({ message: 'Danh sách phương tiện phải là mảng' })
  @ArrayMaxSize(8, { message: 'Tối đa 8 phương tiện cho mỗi bài viết' })
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  media?: PostMediaItemDto[];

  @IsOptional()
  @IsArray({ message: 'Danh sách người được gắn thẻ phải là mảng' })
  @ArrayMaxSize(20, { message: 'Tối đa gắn thẻ 20 người' })
  @IsUUID('4', { each: true, message: 'Mã người được gắn thẻ không hợp lệ' })
  taggedUserIds?: string[];
}
