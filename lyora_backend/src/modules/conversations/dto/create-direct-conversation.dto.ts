import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @IsNotEmpty({ message: 'Mã người dùng nhận hội thoại không được để trống' })
  @IsUUID('all', {
    message: 'Mã người dùng nhận hội thoại phải là định dạng UUID hợp lệ',
  })
  targetUserId: string;
}
