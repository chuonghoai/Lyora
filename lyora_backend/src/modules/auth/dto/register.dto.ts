import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải bao gồm đúng 6 chữ số' })
  otp: string;
}
