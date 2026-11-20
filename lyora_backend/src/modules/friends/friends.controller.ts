import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FriendResponseDto } from './dto/friend-response.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Lấy danh sách bạn bè thành công')
  async getFriends(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FriendResponseDto[]> {
    return this.friendsService.getAcceptedFriends(currentUser.id);
  }
}
