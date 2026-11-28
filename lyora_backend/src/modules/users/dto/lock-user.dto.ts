import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LockUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Lý do khóa tài khoản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập rõ lý do khóa tài khoản' })
  @MinLength(10, {
    message: 'Lý do khóa tài khoản cần tối thiểu 10 ký tự để đảm bảo minh bạch',
  })
  @MaxLength(500, {
    message: 'Lý do khóa tài khoản không được vượt quá 500 ký tự',
  })
  reason: string;
}
