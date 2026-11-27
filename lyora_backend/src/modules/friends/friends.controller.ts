import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FriendResponseDto } from './dto/friend-response.dto';
import { FriendDiscoveryResponseDto } from './dto/friend-discovery-response.dto';
import { FriendSearchQueryDto } from './dto/friend-search-query.dto';
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

  @Get('search')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Tìm kiếm thành viên thành công')
  async searchMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FriendSearchQueryDto,
  ): Promise<{ items: FriendDiscoveryResponseDto[]; totalItems: number }> {
    return this.friendsService.searchMembers(currentUser.id, query);
  }

  @Get('requests/received')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Lấy lời mời kết bạn thành công')
  async getReceivedRequests(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FriendDiscoveryResponseDto[]> {
    return this.friendsService.getReceivedRequests(currentUser.id);
  }

  @Post(':userId/requests')
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Đã gửi lời mời kết bạn')
  async sendRequest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friendsService.sendRequest(currentUser.id, userId);
  }

  @Patch(':userId/requests/accept')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Đã chấp nhận lời mời kết bạn')
  async acceptRequest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friendsService.acceptRequest(currentUser.id, userId);
  }

  @Delete(':userId/requests')
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Đã hủy lời mời kết bạn')
  async removeRequest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friendsService.removeRequest(currentUser.id, userId);
  }

  @Delete(':userId')
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Đã hủy kết bạn')
  async unfriend(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friendsService.unfriend(currentUser.id, userId);
  }
}
