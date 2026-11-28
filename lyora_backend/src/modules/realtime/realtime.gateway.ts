import { HttpException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../../common/enums/role.enum';
import {
  REALTIME_FRIENDS_SERVICE,
  type RealtimeFriendsService,
} from './realtime.constants';

export interface RealtimeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

interface FriendActionPayload {
  userId: string;
}

interface SocketActionResponse {
  success: boolean;
  message?: string;
}

type SocketAcknowledgement = (response: SocketActionResponse) => void;

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const auth = client.handshake.auth as { token?: unknown };
    const token = auth.token;
    if (typeof token !== 'string' || token.trim().length === 0) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
      if (
        !payload.sub ||
        (payload.role !== UserRole.CLIENT && payload.role !== UserRole.ADMIN)
      ) {
        throw new UnauthorizedException();
      }
      const clientData = client.data as { userId?: string; role?: UserRole };
      clientData.userId = payload.sub;
      clientData.role = payload.role;
      await client.join(this.userRoom(payload.sub));
      if (payload.role === UserRole.CLIENT) {
        this.registerFriendActionHandlers(client, payload.sub);
      }
    } catch {
      this.logger.warn(`Từ chối kết nối realtime không hợp lệ: ${client.id}`);
      client.disconnect(true);
    }
  }

  emitToUser<T>(userId: string, event: string, payload: T): void {
    if (!this.server) return;
    this.server.to(this.userRoom(userId)).emit(event, {
      type: event,
      payload,
      timestamp: new Date().toISOString(),
    } satisfies RealtimeEvent<T>);
  }

  emitToUsers<T>(userIds: string[], event: string, payload: T): void {
    for (const userId of new Set(userIds)) {
      this.emitToUser(userId, event, payload);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private registerFriendActionHandlers(
    client: Socket,
    currentUserId: string,
  ): void {
    client.on(
      'friend.request.send',
      (payload: unknown, acknowledge?: unknown) =>
        void this.handleFriendAction(
          currentUserId,
          payload,
          acknowledge,
          (friends, targetUserId) =>
            friends.sendRequest(currentUserId, targetUserId),
        ),
    );
    client.on(
      'friend.request.accept',
      (payload: unknown, acknowledge?: unknown) =>
        void this.handleFriendAction(
          currentUserId,
          payload,
          acknowledge,
          (friends, targetUserId) =>
            friends.acceptRequest(currentUserId, targetUserId),
        ),
    );
    client.on(
      'friend.request.remove',
      (payload: unknown, acknowledge?: unknown) =>
        void this.handleFriendAction(
          currentUserId,
          payload,
          acknowledge,
          (friends, targetUserId) =>
            friends.removeRequest(currentUserId, targetUserId),
        ),
    );
    client.on(
      'friend.remove',
      (payload: unknown, acknowledge?: unknown) =>
        void this.handleFriendAction(
          currentUserId,
          payload,
          acknowledge,
          (friends, targetUserId) =>
            friends.unfriend(currentUserId, targetUserId),
        ),
    );
  }

  private async handleFriendAction(
    currentUserId: string,
    payload: unknown,
    acknowledge: unknown,
    action: (
      friends: RealtimeFriendsService,
      targetUserId: string,
    ) => Promise<void>,
  ): Promise<void> {
    const respond = this.toAcknowledgement(acknowledge);
    try {
      const targetUserId = this.getTargetUserId(payload);
      const friends = this.moduleRef.get<RealtimeFriendsService>(
        REALTIME_FRIENDS_SERVICE,
        { strict: false },
      );
      await action(friends, targetUserId);
      respond?.({ success: true });
    } catch (error) {
      respond?.({ success: false, message: this.getErrorMessage(error) });
    }
  }

  private getTargetUserId(payload: unknown): string {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('userId' in payload) ||
      typeof (payload as FriendActionPayload).userId !== 'string' ||
      !(payload as FriendActionPayload).userId.trim()
    ) {
      throw new UnauthorizedException('Dữ liệu thao tác bạn bè không hợp lệ');
    }
    return (payload as FriendActionPayload).userId;
  }

  private toAcknowledgement(value: unknown): SocketAcknowledgement | undefined {
    return typeof value === 'function'
      ? (value as SocketAcknowledgement)
      : undefined;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response && 'message' in response) {
        const message = response.message;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
    }
    return 'Không thể hoàn tất thao tác bạn bè.';
  }
}
