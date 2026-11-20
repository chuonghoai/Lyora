import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ConversationType } from '../enums/conversation-type.enum';

export class ConversationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ConversationType, {
    message: 'Loại hội thoại phải là DIRECT hoặc GROUP',
  })
  type?: ConversationType;
}
