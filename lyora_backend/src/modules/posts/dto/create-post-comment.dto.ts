import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PostMediaItemDto } from './create-post.dto';

export class CreatePostCommentDto {
  @IsOptional()
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Bình luận tối đa 1.000 ký tự' })
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostMediaItemDto)
  media?: PostMediaItemDto | null;

  @IsOptional()
  @IsUUID('4', { message: 'Mã bình luận gốc không hợp lệ' })
  parentId?: string | null;
}
