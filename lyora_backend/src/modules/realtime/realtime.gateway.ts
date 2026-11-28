import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../../common/enums/role.enum';

export interface RealtimeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

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
      if (!payload.sub || payload.role !== UserRole.CLIENT) {
        throw new UnauthorizedException();
      }
      const clientData = client.data as { userId?: string };
      clientData.userId = payload.sub;
      await client.join(this.userRoom(payload.sub));
    } catch {
      this.logger.warn(`Từ chối kết nối realtime không hợp lệ: ${client.id}`);
      client.disconnect(true);
    }
  }

  emitToUser<T>(userId: string, event: string, payload: T): void {
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
}
