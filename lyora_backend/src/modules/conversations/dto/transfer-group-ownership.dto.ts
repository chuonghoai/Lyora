import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferGroupOwnershipDto {
  @IsNotEmpty({ message: 'ID Trưởng nhóm mới không được để trống' })
  @IsUUID('all', {
    message: 'ID Trưởng nhóm mới phải là định dạng UUID hợp lệ',
  })
  newOwnerId: string;
}
