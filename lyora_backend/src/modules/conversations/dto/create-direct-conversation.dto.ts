import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @IsNotEmpty({ message: 'targetUserId không được để trống' })
  @IsUUID('all', { message: 'targetUserId phải là định dạng UUID hợp lệ' })
  targetUserId: string;
}
