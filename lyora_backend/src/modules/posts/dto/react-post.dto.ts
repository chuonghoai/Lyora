import { IsEnum } from 'class-validator';
import { PostReactionType } from '../enums/post.enums';

export class ReactPostDto {
  @IsEnum(PostReactionType, { message: 'Loại cảm xúc không hợp lệ' })
  reactionType: PostReactionType;
}
