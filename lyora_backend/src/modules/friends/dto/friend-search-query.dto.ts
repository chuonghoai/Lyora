import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, Min, MinLength } from 'class-validator';

export class FriendSearchQueryDto {
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Vui lòng nhập tối thiểu 2 ký tự để tìm kiếm' })
  @Matches(/\S/, {
    message: 'Từ khóa tìm kiếm không được chỉ chứa khoảng trắng',
  })
  q: string;

  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang tối thiểu là 1' })
  page: number = 1;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  @Max(30, { message: 'Số lượng mỗi trang tối đa là 30' })
  limit: number = 12;
}
