import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { ConversationsService } from './conversations.service';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationSummaryDto,
  PaginatedConversationsDto,
} from './dto/conversation-response.dto';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { TransferGroupOwnershipDto } from './dto/transfer-group-ownership.dto';
import { UpdateGroupTitleDto } from './dto/update-group-title.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Lấy danh sách cuộc hội thoại thành công')
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ConversationQueryDto,
  ): Promise<PaginatedConversationsDto> {
    return this.conversationsService.findAllPaginated(currentUser.id, query);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Lấy thông tin chi tiết cuộc hội thoại thành công')
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.findById(currentUser.id, id);
  }

  @Post('direct')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Khởi tạo cuộc hội thoại trực tiếp thành công')
  async createDirect(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateDirectConversationDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversationsService.createDirectConversation(
      currentUser.id,
      dto,
    );
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Khởi tạo cuộc hội thoại nhóm thành công')
  async createGroup(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateGroupConversationDto,
    @Headers('x-idempotency-key') headerIdempotencyKey?: string,
  ): Promise<ConversationDetailDto> {
    const effectiveKey = headerIdempotencyKey || dto.idempotencyKey;
    return this.conversationsService.createGroupConversation(
      currentUser.id,
      dto,
      effectiveKey,
    );
  }

  @Patch(':id/title')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Cập nhật tên nhóm thành công')
  async updateGroupTitle(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupTitleDto,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.updateGroupTitle(currentUser.id, id, dto);
  }

  @Post(':id/members')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Thêm thành viên vào nhóm thành công')
  async addMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddGroupMembersDto,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.addGroupMembers(currentUser.id, id, dto);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Xóa thành viên khỏi nhóm thành công')
  async removeMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.removeMember(currentUser.id, id, userId);
  }

  @Post(':id/transfer-owner')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Chuyển quyền Trưởng nhóm thành công')
  async transferOwnership(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferGroupOwnershipDto,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.transferOwnership(currentUser.id, id, dto);
  }

  @Post(':id/leave')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Rời khỏi nhóm thành công')
  async leaveGroup(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LeaveGroupDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.conversationsService.leaveGroup(currentUser.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT)
  @ResponseMessage('Giải tán nhóm thành công')
  async dissolveGroup(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.conversationsService.dissolveGroup(currentUser.id, id);
  }
}
