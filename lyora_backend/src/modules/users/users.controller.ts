import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
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
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAllPaginated(query);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Lấy dữ liệu thống kê người dùng thành công')
  async getStatistics(@Query() query: UserStatisticsQueryDto) {
    return this.usersService.getStatistics(query.role);
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
