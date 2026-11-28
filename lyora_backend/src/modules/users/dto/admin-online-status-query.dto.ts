import { IsOptional, IsString } from 'class-validator';

export class AdminOnlineStatusQueryDto {
  @IsOptional()
  @IsString()
  ids?: string;
}

export interface AdminOnlineStatusResponseDto {
  statuses: Record<string, boolean>;
  onlineCount: number;
  checkedAt: string;
}
