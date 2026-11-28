import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<
    Pick<
      Repository<Notification>,
      'create' | 'save' | 'find' | 'findOne' | 'update'
    >
  >;
  let realtimeGateway: jest.Mocked<Pick<RealtimeGateway, 'emitToUser'>>;

  beforeEach(() => {
    notificationRepository = {
      create: jest.fn(
        (payload: Partial<Notification>) => payload as Notification,
      ),
      save: jest.fn(async (entity: Notification) =>
        Promise.resolve({
          ...entity,
          id: 'noti-1',
          createdAt: new Date('2026-11-28T14:20:00.000Z'),
          updatedAt: new Date('2026-11-28T14:20:00.000Z'),
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    realtimeGateway = {
      emitToUser: jest.fn(),
    };

    service = new NotificationsService(
      notificationRepository as unknown as Repository<Notification>,
      realtimeGateway as unknown as RealtimeGateway,
    );
  });

  it('lưu DB và phát notification.created qua Socket.IO cho lời mời kết bạn và chấp nhận kết bạn', async () => {
    const req = await service.createFriendRequest(
      'user-b',
      'Nguyễn Văn A',
      'user-a',
    );
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'user-b',
      'notification.created',
      req,
    );

    const accepted = await service.createFriendRequestAccepted(
      'user-a',
      'Trần Thị B',
      'user-b',
    );
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'user-a',
      'notification.created',
      accepted,
    );
  });

  it('lưu DB và phát notification.created qua Socket.IO cho thông báo kiểm duyệt & khiếu nại', async () => {
    const hiddenNotice = await service.createModerationNotice({
      recipientId: 'client-1',
      actorId: 'admin-1',
      type: NotificationType.POST_HIDDEN,
      title: 'Bài viết đã bị ẩn',
      description: 'Vi phạm quy tắc cộng đồng',
      targetPath: '/post/post-1',
    });

    expect(hiddenNotice.type).toBe(NotificationType.POST_HIDDEN);
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'client-1',
      'notification.created',
      hiddenNotice,
    );

    const appealNotice = await service.createModerationNotice({
      recipientId: 'admin-1',
      actorId: 'client-1',
      type: NotificationType.POST_APPEAL_SUBMITTED,
      title: 'Có khiếu nại mới',
      description: 'Người dùng gửi khiếu nại bài viết',
      targetPath: '/admin/posts?tab=appeals',
    });

    expect(appealNotice.type).toBe(NotificationType.POST_APPEAL_SUBMITTED);
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'admin-1',
      'notification.created',
      appealNotice,
    );
  });

  it('phát notification.updated qua Socket.IO khi đánh dấu đã đọc và đọc tất cả', async () => {
    (notificationRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.markRead('user-1', 'missing-id')).rejects.toThrow(
      NotFoundException,
    );

    (notificationRepository.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'noti-1',
      recipientId: 'user-1',
      isRead: false,
    });
    await service.markRead('user-1', 'noti-1');
    expect(notificationRepository.update).toHaveBeenCalledWith('noti-1', {
      isRead: true,
    });
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'user-1',
      'notification.updated',
      { notificationId: 'noti-1', isRead: true },
    );

    await service.markAllRead('user-1');
    expect(notificationRepository.update).toHaveBeenCalledWith(
      { recipientId: 'user-1', isRead: false },
      { isRead: true },
    );
    expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
      'user-1',
      'notification.updated',
      { allRead: true },
    );
  });
});
