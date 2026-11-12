import { describe, it, expect, beforeEach } from 'vitest';
import { WebSocketService } from '@/core/websocket';

describe('WebSocketService Lifecycle & Event Registry', () => {
  let wsService: WebSocketService;

  beforeEach(() => {
    wsService = new WebSocketService({
      url: 'ws://localhost:3000/ws',
      heartbeatIntervalMs: 5000,
      reconnectIntervalMs: 1000,
      maxReconnectAttempts: 3,
    });
  });

  it('should initialize in DISCONNECTED status', () => {
    expect(wsService.getStatus()).toBe('DISCONNECTED');
    expect(wsService.isConnected()).toBe(false);
  });

  it('should notify status change listeners', () => {
    const statuses: string[] = [];
    const unsubscribe = wsService.onStatusChange((status) => {
      statuses.push(status);
    });

    expect(statuses.length).toBe(1);
    expect(statuses[0]).toBe('DISCONNECTED');
    unsubscribe();
  });

  it('should register and unregister event subscribers correctly', () => {
    let callCount = 0;
    const testHandler = () => {
      callCount++;
    };

    const unsubscribe = wsService.subscribe('ORDER_UPDATE', testHandler);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    expect(callCount).toBe(0);
  });

  it('should safely return false when attempting to send while disconnected', () => {
    const success = wsService.send('CHAT_MESSAGE', { text: 'Hello' });
    expect(success).toBe(false);
  });

  it('should safely disconnect without throwing errors', () => {
    expect(() => {
      wsService.disconnect();
    }).not.toThrow();
    expect(wsService.getStatus()).toBe('DISCONNECTED');
  });
});
