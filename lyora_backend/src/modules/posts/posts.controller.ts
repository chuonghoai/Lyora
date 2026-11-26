import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { PostQueryDto } from './dto/post-query.dto';
import { SuggestPostContentDto } from './dto/suggest-post-content.dto';
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

  @Get(':id')
  @ResponseMessage('Lấy chi tiết bài viết thành công')
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.postsService.findOne(currentUser, id);
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
