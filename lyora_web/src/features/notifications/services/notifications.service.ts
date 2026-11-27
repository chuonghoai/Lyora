import {
  notificationsRepository,
  NotificationsRepository,
} from "../repositories/notifications.repository";
import type { AppNotification } from "../types/notification.types";

export class NotificationsService {
  private readonly repository: NotificationsRepository;

  constructor(repository: NotificationsRepository = notificationsRepository) {
    this.repository = repository;
  }

  async getMine(): Promise<AppNotification[]> {
    return (await this.repository.getMine()).data;
  }

  async markRead(id: string): Promise<void> {
    await this.repository.markRead(id);
  }

  async markAllRead(): Promise<void> {
    await this.repository.markAllRead();
  }
}

export const notificationsService = new NotificationsService();
