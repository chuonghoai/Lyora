import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateGroupConversationDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Tên nhóm không được để trống' })
  @IsString({ message: 'Tên nhóm phải là chuỗi văn bản' })
  @Length(2, 100, { message: 'Tên nhóm phải có độ dài từ 2 đến 100 ký tự' })
  title: string;

  @IsArray({ message: 'Danh sách thành viên phải là một mảng' })
  @ArrayMinSize(2, {
    message:
      'Hội thoại nhóm cần tối thiểu 2 người bạn (tổng 3 thành viên bao gồm người tạo)',
  })
  @ArrayMaxSize(99, {
    message:
      'Hội thoại nhóm tối đa 99 người bạn (tổng 100 thành viên bao gồm người tạo)',
  })
  @ArrayUnique({ message: 'Danh sách thành viên không được chứa ID trùng lặp' })
  @IsUUID('all', {
    each: true,
    message: 'Mỗi ID thành viên phải là định dạng UUID hợp lệ',
  })
  memberIds: string[];

  @IsOptional()
  @IsString({ message: 'Idempotency key phải là chuỗi ký tự' })
  idempotencyKey?: string;
}
