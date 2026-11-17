import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(150, { message: 'Họ và tên tối đa 150 ký tự' })
  fullName?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9+\-\s().]{8,20}$/, {
    message: 'Số điện thoại không đúng định dạng (8–20 ký tự)',
  })
  phoneNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Giới thiệu bản thân phải là chuỗi ký tự' })
  @MaxLength(300, { message: 'Giới thiệu bản thân tối đa 300 ký tự' })
  bio?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Địa điểm phải là chuỗi ký tự' })
  @MaxLength(120, { message: 'Địa điểm tối đa 120 ký tự' })
  location?: string | null;
}
