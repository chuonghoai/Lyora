import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UserRole } from '../../../common/enums/role.enum';
import { PostModerationStatus, PostVisibility } from '../enums/post.enums';

export type AdminPostStatusQuery = 'ALL' | PostModerationStatus;

export class AdminPostQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['ALL', PostModerationStatus.ACTIVE, PostModerationStatus.HIDDEN], {
    message: 'Trạng thái kiểm duyệt không hợp lệ',
  })
  status?: AdminPostStatusQuery;

  @IsOptional()
  @IsEnum(PostVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: PostVisibility;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò tác giả không hợp lệ' })
  authorRole?: UserRole;

  @IsOptional()
  @IsIn(['true', 'false'], { message: 'Bộ lọc phương tiện không hợp lệ' })
  hasMedia?: 'true' | 'false';
}
