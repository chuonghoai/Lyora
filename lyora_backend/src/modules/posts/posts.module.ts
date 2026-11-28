import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Friendship } from '../friends/entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostShare } from './entities/post-share.entity';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
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
      User,
      Friendship,
    ]),
    AiModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    CloudinaryService,
    MediaUploadService,
    PostAiSuggestionService,
  ],
  exports: [PostsService],
})
export class PostsModule {}
