import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class AddGroupMembersDto {
  @IsArray({ message: 'Danh sách thành viên phải là một mảng' })
  @ArrayMinSize(1, {
    message: 'Cần chọn ít nhất 1 thành viên để thêm vào nhóm',
  })
  @ArrayMaxSize(50, {
    message: 'Không thể thêm quá 50 thành viên trong một lần',
  })
  @ArrayUnique({ message: 'Danh sách thành viên không được chứa ID trùng lặp' })
  @IsUUID('all', {
    each: true,
    message: 'Mỗi ID thành viên phải là định dạng UUID hợp lệ',
  })
  memberIds: string[];
}
