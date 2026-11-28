import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface CreateModerationNoticeParams {
  recipientId: string;
  actorId: string;
  type:
    | NotificationType.POST_HIDDEN
    | NotificationType.POST_RESTORED
    | NotificationType.POST_REMOVED
    | NotificationType.COMMENT_REMOVED
    | NotificationType.POST_APPEAL_SUBMITTED
    | NotificationType.POST_APPEAL_REJECTED
    | NotificationType.POST_VIOLATION_FLAGGED
    | NotificationType.AVATAR_VIOLATION_FLAGGED
    | NotificationType.COVER_VIOLATION_FLAGGED;
  title: string;
  description: string;
  targetPath?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createFriendRequest(
    recipientId: string,
    actorName: string,
    actorId: string,
  ) {
    return this.createAndEmit({
      recipientId,
      actorId,
      type: NotificationType.FRIEND_REQUEST,
      title: `${actorName} đã gửi cho bạn lời mời kết bạn`,
      description: 'Mở mục Bạn bè để chấp nhận hoặc từ chối lời mời.',
      targetPath: '/friends',
    });
  }

  async createFriendRequestAccepted(
    recipientId: string,
    actorName: string,
    actorId: string,
  ) {
    return this.createAndEmit({
      recipientId,
      actorId,
      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      title: `${actorName} đã chấp nhận lời mời kết bạn`,
      description: 'Hai bạn hiện đã là bạn bè trên Lyora.',
      targetPath: '/friends',
    });
  }

  async createModerationNotice(params: CreateModerationNoticeParams) {
    return this.createAndEmit({
      recipientId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      title: params.title.slice(0, 255),
      description: params.description.slice(0, 500),
      targetPath: params.targetPath ?? '/me',
    });
  }

  private async createAndEmit(params: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    title: string;
    description: string;
    targetPath: string | null;
  }): Promise<Notification> {
    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        recipientId: params.recipientId,
        actorId: params.actorId,
        type: params.type,
        title: params.title,
        description: params.description,
        targetPath: params.targetPath,
        isRead: false,
      }),
    );
    this.realtimeGateway.emitToUser(
      notification.recipientId,
      'notification.created',
      notification,
    );
    return notification;
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
    if (!notification.isRead) {
      await this.notificationRepository.update(notification.id, {
        isRead: true,
      });
      this.realtimeGateway.emitToUser(recipientId, 'notification.updated', {
        notificationId: notification.id,
        isRead: true,
      });
    }
  }

  async markAllRead(recipientId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId, isRead: false },
      { isRead: true },
    );
    this.realtimeGateway.emitToUser(recipientId, 'notification.updated', {
      allRead: true,
    });
  }
}
