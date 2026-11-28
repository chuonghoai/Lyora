import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { VietnameseParseUUIDPipe } from '../../common/pipes/vietnamese-parse-uuid.pipe';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Lấy thông báo thành công')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findMine(user.id);
  }

  @Patch('read-all')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Đã đánh dấu toàn bộ thông báo là đã đọc')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Đã đánh dấu thông báo là đã đọc')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(user.id, id);
  }
}
