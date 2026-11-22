import { IsOptional, IsUUID } from 'class-validator';

export class LeaveGroupDto {
  @IsOptional()
  @IsUUID('all', {
    message: 'ID Trưởng nhóm kế nhiệm phải là định dạng UUID hợp lệ',
  })
  newOwnerId?: string;
}
