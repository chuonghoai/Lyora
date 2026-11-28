import { io, type Socket } from 'socket.io-client';
import type {
  WebSocketConfig,
  WebSocketEventHandler,
  WebSocketStatus,
} from './websocket.types';
import { TokenStorage } from '@/core/storage';
import { logger } from '@/core/utils/logger';

export class WebSocketService {
  private socket: Socket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private statusListeners: Array<(status: WebSocketStatus) => void> = [];
  private eventListeners = new Map<string, Set<WebSocketEventHandler>>();
  private readonly config: Required<WebSocketConfig>;

  constructor(config?: WebSocketConfig) {
    this.config = {
      url: config?.url ?? this.resolveDefaultUrl(),
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
    };
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'CONNECTED';
  }

  onStatusChange(listener: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((item) => item !== listener);
    };
  }

  connect(): void {
    if (typeof window === 'undefined' || this.socket?.connected) return;
    const token = TokenStorage.getAccessToken();
    if (!token) return;

    this.socket?.disconnect();
    this.setStatus('CONNECTING');
    this.socket = io(`${this.config.url}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: this.config.maxReconnectAttempts,
    });
    this.socket.on('connect', () => this.setStatus('CONNECTED'));
    this.socket.on('disconnect', () => this.setStatus('DISCONNECTED'));
    this.socket.on('connect_error', (error) => {
      logger.warn('WebSocketService', 'Kết nối realtime thất bại:', error.message);
      this.setStatus('ERROR');
    });
    for (const [event, handlers] of this.eventListeners) {
      this.registerSocketEvent(event, handlers);
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('DISCONNECTED');
  }

  send<T = unknown>(event: string, data: T): boolean {
    if (!this.socket?.connected) return false;
    this.socket.emit(event, data);
    return true;
  }

  async request<T = unknown>(event: string, payload: T): Promise<void> {
    const socket = await this.waitForConnection();
    return new Promise((resolve, reject) => {
      socket.timeout(8_000).emit(
        event,
        payload,
        (timeoutError: Error | null, response?: { success?: boolean; message?: string }) => {
          if (timeoutError) {
            reject(new Error('Không nhận được phản hồi realtime. Vui lòng thử lại.'));
            return;
          }
          if (!response?.success) {
            reject(new Error(response?.message ?? 'Không thể hoàn tất thao tác bạn bè.'));
            return;
          }
          resolve();
        },
      );
    });
  }

  subscribe<T = unknown>(event: string, handler: WebSocketEventHandler<T>): () => void {
    const handlers = this.eventListeners.get(event) ?? new Set<WebSocketEventHandler>();
    handlers.add(handler as WebSocketEventHandler);
    this.eventListeners.set(event, handlers);
    this.registerSocketEvent(event, handlers);

    return () => {
      const current = this.eventListeners.get(event);
      current?.delete(handler as WebSocketEventHandler);
      if (!current?.size) {
        this.eventListeners.delete(event);
        this.socket?.off(event);
      }
    };
  }

  private resolveDefaultUrl(): string {
    const configuredUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL;
    if (configuredUrl) return configuredUrl.replace(/\/$/, '');
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  private waitForConnection(): Promise<Socket> {
    if (this.socket?.connected) return Promise.resolve(this.socket);
    this.connect();
    const socket = this.socket;
    if (!socket) {
      return Promise.reject(new Error('Kết nối realtime chưa sẵn sàng.'));
    }
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        reject(new Error('Kết nối realtime quá thời gian chờ.'));
      }, 8_000);
      const onConnect = () => {
        window.clearTimeout(timeout);
        socket.off('connect_error', onConnectError);
        resolve(socket);
      };
      const onConnectError = () => {
        window.clearTimeout(timeout);
        socket.off('connect', onConnect);
        reject(new Error('Không thể kết nối realtime.'));
      };
      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
    });
  }

  private registerSocketEvent(event: string, handlers: Set<WebSocketEventHandler>): void {
    if (!this.socket) return;
    this.socket.off(event);
    this.socket.on(event, (message: unknown) => {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          logger.error('WebSocketService', `Lỗi xử lý event ${event}:`, error);
        }
      }
    });
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const webSocketService = new WebSocketService();
