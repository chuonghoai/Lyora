import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PostSuggestionTone {
  FRIENDLY = 'FRIENDLY',
  FUNNY = 'FUNNY',
  PROFESSIONAL = 'PROFESSIONAL',
  INSPIRING = 'INSPIRING',
  CONCISE = 'CONCISE',
}

export class SuggestPostContentDto {
  @IsOptional()
  @IsString({ message: 'Ý chính phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ý chính tối đa 500 ký tự' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'Nội dung hiện tại phải là chuỗi ký tự' })
  @MaxLength(5000, { message: 'Nội dung hiện tại tối đa 5.000 ký tự' })
  currentContent?: string;

  @IsEnum(PostSuggestionTone, { message: 'Giọng điệu không hợp lệ' })
  tone: PostSuggestionTone;
}
