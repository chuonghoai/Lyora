import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Friendship } from '../friends/entities/friendship.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { AdminPostsController } from './admin-posts.controller';
import { PostAppeal } from './entities/post-appeal.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostShare } from './entities/post-share.entity';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AdminPostsService } from './services/admin-posts.service';
import { CloudinaryService } from './services/cloudinary.service';
import { MediaUploadService } from './services/media-upload.service';
import { PostAiSuggestionService } from './services/post-ai-suggestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostReaction,
      PostComment,
      PostShare,
      PostAppeal,
      User,
      Friendship,
    ]),
    AiModule,
    NotificationsModule,
  ],
  controllers: [PostsController, AdminPostsController],
  providers: [
    PostsService,
    AdminPostsService,
    CloudinaryService,
    MediaUploadService,
    PostAiSuggestionService,
  ],
  exports: [PostsService, AdminPostsService],
})
export class PostsModule {}
