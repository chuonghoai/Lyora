import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PostVisibility } from '../enums/post.enums';

export class PostQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PostVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: PostVisibility;

  @IsOptional()
  @IsUUID('4', { message: 'Mã tác giả không hợp lệ' })
  authorId?: string;

  @IsOptional()
  @IsIn(['all', 'mine', 'saved'], { message: 'Bộ lọc bài viết không hợp lệ' })
  filter?: 'all' | 'mine' | 'saved';
}
