import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PostReactionType } from '../enums/post.enums';

export class PostReactionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PostReactionType, { message: 'Loại cảm xúc không hợp lệ' })
  reactionType?: PostReactionType;
}

export class PostSharesQueryDto extends PaginationQueryDto {}
