import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';

export class UserStatisticsQueryDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò lọc thống kê không hợp lệ' })
  role?: UserRole;
}
