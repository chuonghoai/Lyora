import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PostAppealStatus } from '../enums/post.enums';

export class CreatePostAppealDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Nhóm lý do khiếu nại phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Vui lòng chọn hoặc nhập nhóm lý do khiếu nại' })
  @MaxLength(120, { message: 'Nhóm lý do khiếu nại tối đa 120 ký tự' })
  reasonCategory: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Nội dung khiếu nại phải là chuỗi ký tự' })
  @MinLength(5, {
    message: 'Vui lòng nhập nội dung khiếu nại tối thiểu 5 ký tự',
  })
  @MaxLength(1000, { message: 'Nội dung khiếu nại tối đa 1000 ký tự' })
  reasonDetail: string;
}

export type AdminPostAppealStatusQuery = 'ALL' | PostAppealStatus;

export class AdminPostAppealsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(
    [
      'ALL',
      PostAppealStatus.PENDING,
      PostAppealStatus.RESTORED,
      PostAppealStatus.REJECTED,
    ],
    { message: 'Trạng thái khiếu nại không hợp lệ' },
  )
  status?: AdminPostAppealStatusQuery;
}

export class RejectPostAppealDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Minh chứng phải là chuỗi ký tự' })
  @MinLength(10, {
    message: 'Vui lòng nhập minh chứng cụ thể tối thiểu 10 ký tự',
  })
  @MaxLength(1000, { message: 'Minh chứng tối đa 1000 ký tự' })
  evidence: string;
}
