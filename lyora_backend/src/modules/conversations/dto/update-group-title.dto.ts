import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateGroupTitleDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Tên nhóm không được để trống' })
  @IsString({ message: 'Tên nhóm phải là chuỗi văn bản' })
  @Length(2, 100, { message: 'Tên nhóm phải có độ dài từ 2 đến 100 ký tự' })
  title: string;
}
