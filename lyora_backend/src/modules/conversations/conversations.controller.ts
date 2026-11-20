import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ConversationsService } from './conversations.service';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationSummaryDto,
  PaginatedConversationsDto,
} from './dto/conversation-response.dto';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';

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
}
