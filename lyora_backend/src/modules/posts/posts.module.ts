import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CloudinaryService } from './services/cloudinary.service';
import { MediaUploadService } from './services/media-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostReaction, PostComment, User])],
  controllers: [PostsController],
  providers: [PostsService, CloudinaryService, MediaUploadService],
  exports: [PostsService],
})
export class PostsModule {}
