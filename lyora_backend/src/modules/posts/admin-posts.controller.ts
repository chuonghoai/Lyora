import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { VietnameseParseUUIDPipe } from '../../common/pipes/vietnamese-parse-uuid.pipe';
import { AdminPostQueryDto } from './dto/admin-post-query.dto';
import {
  HidePostModerationDto,
  RemoveModerationReasonDto,
} from './dto/moderate-post.dto';
import { AdminPostsService } from './services/admin-posts.service';

@Controller('admin/posts')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPostsController {
  constructor(private readonly adminPostsService: AdminPostsService) {}

  @Get('statistics')
  @ResponseMessage('Lấy thống kê bài viết thành công')
  async getStatistics() {
    return this.adminPostsService.getStatistics();
  }

  @Get()
  @ResponseMessage('Lấy danh sách bài viết quản trị thành công')
  async findAll(@Query() query: AdminPostQueryDto) {
    return this.adminPostsService.findAllPaginated(query);
  }

  @Get(':id')
  @ResponseMessage('Lấy chi tiết bài viết thành công')
  async findOne(@Param('id', VietnameseParseUUIDPipe) id: string) {
    return this.adminPostsService.findOneDetail(id);
  }

  @Patch(':id/hide')
  @ResponseMessage('Đã ẩn bài viết vi phạm')
  async hidePost(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
    @Body() dto: HidePostModerationDto,
  ) {
    return this.adminPostsService.hidePost(adminUser, id, dto);
  }

  @Patch(':id/restore')
  @ResponseMessage('Đã khôi phục hiển thị bài viết')
  async restorePost(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
  ) {
    return this.adminPostsService.restorePost(adminUser, id);
  }

  @Delete(':id')
  @ResponseMessage('Đã gỡ bỏ bài viết')
  async removePost(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
    @Body() dto: RemoveModerationReasonDto,
  ) {
    await this.adminPostsService.removePost(adminUser, id, dto);
    return null;
  }

  @Delete(':postId/comments/:commentId')
  @ResponseMessage('Đã gỡ bỏ bình luận vi phạm')
  async removeComment(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('postId', VietnameseParseUUIDPipe) postId: string,
    @Param('commentId', VietnameseParseUUIDPipe) commentId: string,
    @Body() dto: RemoveModerationReasonDto,
  ) {
    await this.adminPostsService.removeComment(
      adminUser,
      postId,
      commentId,
      dto,
    );
    return null;
  }
}
