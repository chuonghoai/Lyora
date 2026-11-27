import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createFriendRequest(
    recipientId: string,
    actorName: string,
    actorId: string,
  ) {
    return this.notificationRepository.save(
      this.notificationRepository.create({
        recipientId,
        actorId,
        type: NotificationType.FRIEND_REQUEST,
        title: `${actorName} đã gửi cho bạn lời mời kết bạn`,
        description: 'Mở mục Bạn bè để chấp nhận hoặc từ chối lời mời.',
        targetPath: '/friends',
        isRead: false,
      }),
    );
  }

  async createFriendRequestAccepted(
    recipientId: string,
    actorName: string,
    actorId: string,
  ) {
    return this.notificationRepository.save(
      this.notificationRepository.create({
        recipientId,
        actorId,
        type: NotificationType.FRIEND_REQUEST_ACCEPTED,
        title: `${actorName} đã chấp nhận lời mời kết bạn`,
        description: 'Hai bạn hiện đã là bạn bè trên Lyora.',
        targetPath: '/friends',
        isRead: false,
      }),
    );
  }

  async findMine(recipientId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async markRead(recipientId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId },
    });
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
    if (!notification.isRead)
      await this.notificationRepository.update(notification.id, {
        isRead: true,
      });
  }

  async markAllRead(recipientId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId, isRead: false },
      { isRead: true },
    );
  }
}
