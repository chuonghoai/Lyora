import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePostAppealDto } from './dto/post-appeal.dto';
import {
  PostCommentsQueryDto,
  PostReactionsQueryDto,
  PostSharesQueryDto,
} from './dto/post-interactions-query.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { SuggestPostContentDto } from './dto/suggest-post-content.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import { PostAiSuggestionService } from './services/post-ai-suggestion.service';
import {
  isAllowedMimeType,
  MAX_UPLOAD_FILE_SIZE,
  MAX_UPLOAD_FILES,
  MediaUploadService,
} from './services/media-upload.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly postAiSuggestionService: PostAiSuggestionService,
  ) {}

  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tải tệp lên thành công')
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_FILE_SIZE, files: MAX_UPLOAD_FILES },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedMimeType(file.mimetype)) {
          callback(
            new BadRequestException(
              'Chỉ hỗ trợ ảnh (JPG, PNG, WEBP, GIF), video (MP4, WEBM) và âm thanh (WEBM, MP3, WAV, OGG)',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
    return this.mediaUploadService.uploadFiles(files);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Đăng bài viết thành công')
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(currentUser, dto);
  }

  @Get()
  @ResponseMessage('Lấy danh sách bài viết thành công')
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: PostQueryDto,
  ) {
    return this.postsService.findAllPaginated(currentUser, query);
  }

  @Post('ai-suggestions')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Tạo gợi ý nội dung thành công')
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_FILE_SIZE, files: MAX_UPLOAD_FILES },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedMimeType(file.mimetype)) {
          callback(
            new BadRequestException(
              'Chỉ hỗ trợ ảnh (JPG, PNG, WEBP, GIF), video (MP4, WEBM) và âm thanh (WEBM, MP3, WAV, OGG)',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async suggestContent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SuggestPostContentDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.postAiSuggestionService.suggest(currentUser, dto, files);
  }

  @Get(':id/reactions')
  @ResponseMessage('Lấy danh sách cảm xúc bài viết thành công')
  async getReactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PostReactionsQueryDto,
  ) {
    return this.postsService.getPostReactions(currentUser, id, query);
  }

  @Get(':id/shares')
  @ResponseMessage('Lấy danh sách người đã chia sẻ bài viết thành công')
  async getShares(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PostSharesQueryDto,
  ) {
    return this.postsService.getPostShares(currentUser, id, query);
  }

  @Get(':id/comments')
  @ResponseMessage('Lấy danh sách bình luận bài viết thành công')
  async getComments(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PostCommentsQueryDto,
  ) {
    return this.postsService.getPostComments(currentUser, id, query);
  }

  @Post(':id/appeals')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Gửi khiếu nại bài viết thành công')
  async createAppeal(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreatePostAppealDto,
  ) {
    return this.postsService.createAppeal(currentUser, id, dto);
  }

  @Get(':id')
  @ResponseMessage('Lấy chi tiết bài viết thành công')
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.postsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật bài viết thành công')
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Xóa bài viết thành công')
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.postsService.remove(currentUser, id);
    return null;
  }
}
