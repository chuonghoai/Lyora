import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/enums/role.enum';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    gateway = new RealtimeGateway(jwtService as JwtService, configService);
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
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(client.data).toEqual({ userId: 'user-1' });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('ngắt client khi JWT không hợp lệ', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'invalid-token' } },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
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
});
