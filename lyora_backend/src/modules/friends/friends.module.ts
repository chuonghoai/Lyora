import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { User } from '../users/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { REALTIME_FRIENDS_SERVICE } from '../realtime/realtime.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, User]),
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [FriendsController],
  providers: [
    FriendsService,
    { provide: REALTIME_FRIENDS_SERVICE, useExisting: FriendsService },
  ],
  exports: [FriendsService],
})
export class FriendsModule {}
