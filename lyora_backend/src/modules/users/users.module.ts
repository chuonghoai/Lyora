import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from '../friends/entities/friendship.entity';
import { User } from './entities/user.entity';
import { ProfileMediaService } from './services/profile-media.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship])],
  controllers: [UsersController],
  providers: [UsersService, ProfileMediaService],
  exports: [UsersService],
})
export class UsersModule {}
