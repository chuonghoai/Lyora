import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PostMediaType, PostVisibility } from '../enums/post.enums';

export enum PostSuggestionTone {
  FRIENDLY = 'FRIENDLY',
  FUNNY = 'FUNNY',
  PROFESSIONAL = 'PROFESSIONAL',
  INSPIRING = 'INSPIRING',
  CONCISE = 'CONCISE',
}

function parseJsonField(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export class SuggestPostMediaItemDto {
  @IsEnum(PostMediaType, { message: 'Loại phương tiện không hợp lệ' })
  type: PostMediaType;

  @IsOptional()
  @IsString({ message: 'Tên tệp phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Tên tệp tối đa 255 ký tự' })
  fileName?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phương tiện phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Mô tả phương tiện tối đa 255 ký tự' })
  alt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Thời lượng phải là số' })
  @Min(0, { message: 'Thời lượng không được âm' })
  @Max(3600, { message: 'Thời lượng tối đa 3.600 giây' })
  duration?: number;
}

function parseMediaItemsField(value: unknown): unknown {
  const parsed = parseJsonField(value);
  if (!Array.isArray(parsed)) {
    return parsed;
  }
  return parsed.map((item: unknown): unknown =>
    typeof item === 'object' && item !== null
      ? plainToInstance(SuggestPostMediaItemDto, item)
      : item,
  );
}

export class SuggestPostContentDto {
  @IsOptional()
  @IsString({ message: 'Ý chính phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Ý chính tối đa 2.000 ký tự' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'Nội dung hiện tại phải là chuỗi ký tự' })
  @MaxLength(5000, { message: 'Nội dung hiện tại tối đa 5.000 ký tự' })
  currentContent?: string;

  @IsEnum(PostSuggestionTone, { message: 'Giọng điệu không hợp lệ' })
  tone: PostSuggestionTone;

  @IsOptional()
  @IsEnum(PostVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: PostVisibility;

  @IsOptional()
  @Transform(({ value }) => parseJsonField(value))
  @IsArray({ message: 'Danh sách bạn bè gắn thẻ phải là mảng' })
  @ArrayMaxSize(20, { message: 'Tối đa 20 người được gắn thẻ' })
  @IsString({ each: true, message: 'Tên người được gắn thẻ phải là chuỗi' })
  @MaxLength(120, {
    each: true,
    message: 'Tên người được gắn thẻ tối đa 120 ký tự',
  })
  taggedUserNames?: string[];

  @IsOptional()
  @Transform(({ value }) => parseMediaItemsField(value))
  @IsArray({ message: 'Danh sách phương tiện phải là mảng' })
  @ArrayMaxSize(8, { message: 'Tối đa 8 phương tiện đính kèm' })
  @ValidateNested({ each: true })
  @Type(() => SuggestPostMediaItemDto)
  mediaItems?: SuggestPostMediaItemDto[];
}
