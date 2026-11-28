import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UserRole } from '../../../common/enums/role.enum';

export type AdminUserRoleFilter = 'ALL' | UserRole;
export type AdminUserStatusFilter = 'ALL' | 'ACTIVE' | 'LOCKED';
export type AdminUserOnlineFilter = 'ALL' | 'ONLINE' | 'OFFLINE';
export type AdminUserSortBy = 'createdAt' | 'fullName' | 'isOnline';
export type AdminUserSortOrder = 'DESC' | 'ASC';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['ALL', UserRole.CLIENT, UserRole.ADMIN], {
    message: 'Bộ lọc vai trò không hợp lệ',
  })
  role?: AdminUserRoleFilter = 'ALL';

  @IsOptional()
  @IsIn(['ALL', 'ACTIVE', 'LOCKED'], {
    message: 'Bộ lọc trạng thái tài khoản không hợp lệ',
  })
  status?: AdminUserStatusFilter = 'ALL';

  @IsOptional()
  @IsIn(['ALL', 'ONLINE', 'OFFLINE'], {
    message: 'Bộ lọc trạng thái trực tuyến không hợp lệ',
  })
  online?: AdminUserOnlineFilter = 'ALL';

  @IsOptional()
  @IsIn(['createdAt', 'fullName', 'isOnline'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: AdminUserSortBy = 'createdAt';

  @IsOptional()
  @IsIn(['DESC', 'ASC'], {
    message: 'Thứ tự sắp xếp không hợp lệ',
  })
  sortOrder?: AdminUserSortOrder = 'DESC';
}
