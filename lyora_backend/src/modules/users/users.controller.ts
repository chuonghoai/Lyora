import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { VietnameseParseUUIDPipe } from '../../common/pipes/vietnamese-parse-uuid.pipe';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { AdminOnlineStatusQueryDto } from './dto/admin-online-status-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FlagProfileMediaViolationDto } from './dto/flag-profile-media-violation.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { UserStatisticsQueryDto } from './dto/user-statistics-query.dto';
import {
  isAllowedProfileImageMime,
  MAX_PROFILE_IMAGE_SIZE,
  ProfileMediaService,
} from './services/profile-media.service';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileMediaService: ProfileMediaService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy danh sách người dùng thành công')
  async findAll(@Query() query: AdminUsersQueryDto) {
    const result = await this.usersService.findAllPaginated(query);
    return new ApiResponseDto(
      true,
      'Lấy danh sách người dùng thành công',
      {
        items: result.items,
        summary: result.summary,
      },
      result.meta,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tạo tài khoản người dùng thành công')
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy dữ liệu thống kê người dùng thành công')
  async getStatistics(@Query() query: UserStatisticsQueryDto) {
    return this.usersService.getStatistics(query.role);
  }

  @Get('online-status')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy trạng thái trực tuyến người dùng thành công')
  async getOnlineStatuses(@Query() query: AdminOnlineStatusQueryDto) {
    return this.usersService.getOnlineStatuses(query.ids);
  }

  @Get('me/profile')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ResponseMessage('Lấy thông tin hồ sơ cá nhân thành công')
  async getMyProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.getPublicProfile(currentUser, 'me');
  }

  @Patch('me/profile')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ResponseMessage('Cập nhật hồ sơ cá nhân thành công')
  async updateMyProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(currentUser.id, dto);
    return this.usersService.getPublicProfile(currentUser, 'me');
  }

  @Post('me/media')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tải ảnh hồ sơ lên thành công')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROFILE_IMAGE_SIZE, files: 1 },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedProfileImageMime(file.mimetype)) {
          callback(
            new BadRequestException(
              'Chỉ hỗ trợ tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfileMedia(@UploadedFile() file: Express.Multer.File) {
    return this.profileMediaService.uploadProfileImage(file);
  }

  @Get(':id/admin-profile')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy thông tin hồ sơ người dùng thành công')
  async getAdminUserProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
  ) {
    return this.usersService.getAdminUserProfile(currentUser, id);
  }

  @Patch(':id/lock')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Đã khóa tài khoản người dùng thành công')
  async lockUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
    @Body() dto: LockUserDto,
  ) {
    return this.usersService.lockUser(currentUser, id, dto);
  }

  @Patch(':id/unlock')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Đã mở khóa tài khoản người dùng thành công')
  async unlockUser(@Param('id', VietnameseParseUUIDPipe) id: string) {
    return this.usersService.unlockUser(id);
  }

  @Patch(':id/avatar-violation')
  @Roles(UserRole.ADMIN)
  @ResponseMessage(
    'Đã đánh dấu vi phạm ảnh đại diện và gửi thông báo cho người dùng',
  )
  async flagAvatarViolation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
    @Body() dto: FlagProfileMediaViolationDto,
  ) {
    return this.usersService.flagAvatarViolation(currentUser, id, dto);
  }

  @Patch(':id/avatar-violation/clear')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Đã gỡ đánh dấu vi phạm ảnh đại diện')
  async clearAvatarViolation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
  ) {
    return this.usersService.clearAvatarViolation(currentUser, id);
  }

  @Patch(':id/cover-violation')
  @Roles(UserRole.ADMIN)
  @ResponseMessage(
    'Đã đánh dấu vi phạm ảnh bìa và gửi thông báo cho người dùng',
  )
  async flagCoverViolation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
    @Body() dto: FlagProfileMediaViolationDto,
  ) {
    return this.usersService.flagCoverViolation(currentUser, id, dto);
  }

  @Patch(':id/cover-violation/clear')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Đã gỡ đánh dấu vi phạm ảnh bìa')
  async clearCoverViolation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', VietnameseParseUUIDPipe) id: string,
  ) {
    return this.usersService.clearCoverViolation(currentUser, id);
  }

  @Get(':id/profile')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ResponseMessage('Lấy thông tin hồ sơ người dùng thành công')
  async getPublicProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.getPublicProfile(currentUser, id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy thông tin người dùng thành công')
  async findOne(@Param('id', VietnameseParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
