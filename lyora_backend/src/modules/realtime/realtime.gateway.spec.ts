import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/role.enum';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeModule } from './realtime.module';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let moduleRef: jest.Mocked<Pick<ModuleRef, 'get'>>;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    moduleRef = { get: jest.fn() };
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    gateway = new RealtimeGateway(
      jwtService as JwtService,
      configService,
      moduleRef as ModuleRef,
    );
  });

  it('xác thực JWT và đưa client vào room riêng theo user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.CLIENT,
    });
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'valid-token' } },
      data: {},
      join: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(client.data).toEqual({ userId: 'user-1', role: UserRole.CLIENT });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('cho phép ADMIN kết nối phòng user riêng để nhận thông báo realtime và không gắn handler bạn bè', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'admin-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });
    const client = {
      id: 'socket-admin-1',
      handshake: { auth: { token: 'admin-token' } },
      data: {},
      join: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith('user:admin-1');
    expect(client.data).toEqual({ userId: 'admin-1', role: UserRole.ADMIN });
    expect(client.on).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('ngắt client khi JWT không hợp lệ', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'invalid-token' } },
      data: {},
      join: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('chuyển command gửi lời mời vào FriendsService và trả acknowledgement', async () => {
    const handlers = new Map<
      string,
      (payload: unknown, acknowledge: jest.Mock) => void
    >();
    const sendRequest = jest.fn().mockResolvedValue(undefined);
    moduleRef.get.mockReturnValue({ sendRequest });
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.CLIENT,
    });
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'valid-token' } },
      data: {},
      join: jest.fn(),
      on: jest.fn(
        (
          event: string,
          handler: (payload: unknown, acknowledge: jest.Mock) => void,
        ) => {
          handlers.set(event, handler);
        },
      ),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);
    const acknowledge = jest.fn();
    handlers.get('friend.request.send')?.({ userId: 'user-2' }, acknowledge);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sendRequest).toHaveBeenCalledWith('user-1', 'user-2');
    expect(acknowledge).toHaveBeenCalledWith({ success: true });
  });

  it('phát event đúng room và chuẩn payload', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as unknown as { server: { to: jest.Mock } }).server = { to };

    gateway.emitToUser('user-1', 'friendship.updated', {
      action: 'ACCEPTED',
    });

    expect(to).toHaveBeenCalledWith('user:user-1');
    expect(emit).toHaveBeenCalledWith(
      'friendship.updated',
      expect.objectContaining({
        type: 'friendship.updated',
        payload: { action: 'ACCEPTED' },
      }),
    );
  });

  it('bỏ qua an toàn khi server socket chưa sẵn sàng', () => {
    expect(() =>
      gateway.emitToUser('user-1', 'notification.created', { id: 'noti-1' }),
    ).not.toThrow();
  });

  it('biên dịch RealtimeModule thành công và không tạo circular dependency với Users/Auth/Notifications', async () => {
    for (const Mod of [
      RealtimeModule,
      NotificationsModule,
      UsersModule,
      AuthModule,
    ]) {
      const imports = (Reflect.getMetadata('imports', Mod) as unknown[]) ?? [];
      expect(imports.every((item) => item !== undefined)).toBe(true);
    }

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), RealtimeModule],
    }).compile();

    const resolvedGateway = moduleRef.get(RealtimeGateway);
    expect(resolvedGateway).toBeInstanceOf(RealtimeGateway);
    await moduleRef.close();
  });
});
