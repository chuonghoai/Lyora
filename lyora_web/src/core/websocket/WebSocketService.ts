import type {
  WebSocketConfig,
  WebSocketEventHandler,
  WebSocketMessage,
  WebSocketStatus,
} from './websocket.types';
import { TokenStorage } from '@/core/storage';
import { logger } from '@/core/utils/logger';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private status: WebSocketStatus = 'DISCONNECTED';
  private statusListeners: Array<(status: WebSocketStatus) => void> = [];
  private eventListeners = new Map<string, Set<WebSocketEventHandler>>();

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private manualClose = false;

  private config: Required<WebSocketConfig>;

  constructor(config?: WebSocketConfig) {
    this.config = {
      url: config?.url || this.resolveDefaultUrl(),
      heartbeatIntervalMs: config?.heartbeatIntervalMs ?? 30000,
      reconnectIntervalMs: config?.reconnectIntervalMs ?? 2000,
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
      reconnectBackoffMultiplier: config?.reconnectBackoffMultiplier ?? 1.5,
      maxReconnectIntervalMs: config?.maxReconnectIntervalMs ?? 30000,
    };
  }

  private resolveDefaultUrl(): string {
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const wsUrl = apiBase
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://');
    return `${wsUrl}/ws`;
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
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private setStatus(newStatus: WebSocketStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    logger.debug('WebSocketService', `Status changed to: ${newStatus}`);
    for (const listener of this.statusListeners) {
      try {
        listener(newStatus);
      } catch (err) {
        logger.error('WebSocketService', 'Error in status listener:', err);
      }
    }
  }

  connect(): void {
    if (typeof window === 'undefined') return;
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.manualClose = false;
    this.setStatus('CONNECTING');

    const token = TokenStorage.getAccessToken();
    const targetUrl = token
      ? `${this.config.url}${this.config.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
      : this.config.url;

    try {
      this.socket = new WebSocket(targetUrl);

      this.socket.onopen = () => {
        logger.info('WebSocketService', 'WebSocket connection established successfully');
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as WebSocketMessage;
          if (payload && payload.event) {
            this.dispatchMessage(payload.event, payload.data);
          }
        } catch {
          // Plain string message or ping/pong frame
          if (event.data === 'pong') {
            logger.debug('WebSocketService', 'Received heartbeat pong');
          }
        }
      };

      this.socket.onerror = (err) => {
        logger.warn('WebSocketService', 'WebSocket connection error:', err);
        this.setStatus('ERROR');
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('DISCONNECTED');
        if (!this.manualClose) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      logger.error('WebSocketService', 'Failed to initialize WebSocket client:', err);
      this.setStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('DISCONNECTED');
    this.reconnectAttempts = 0;
  }

  private scheduleReconnect(): void {
    if (this.manualClose) return;

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.warn(
        'WebSocketService',
        `Reached max reconnect attempts (${this.config.maxReconnectAttempts}). Stopping auto-reconnect.`,
      );
      this.setStatus('DISCONNECTED');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectIntervalMs *
        Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts - 1),
      this.config.maxReconnectIntervalMs,
    );

    logger.info(
      'WebSocketService',
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms...`,
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected() && this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ event: 'ping' }));
        } catch {
          // Socket write error will trigger onclose
        }
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send<T = unknown>(event: string, data: T): boolean {
    if (!this.isConnected() || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocketService', `Cannot send event "${event}": socket not connected`);
      return false;
    }

    try {
      const message: WebSocketMessage<T> = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      logger.error('WebSocketService', `Failed to send event "${event}":`, err);
      return false;
    }
  }

  subscribe<T = unknown>(event: string, handler: WebSocketEventHandler<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    const handlers = this.eventListeners.get(event)!;
    handlers.add(handler as WebSocketEventHandler);

    return () => {
      handlers.delete(handler as WebSocketEventHandler);
      if (handlers.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  private dispatchMessage(event: string, data: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        logger.error('WebSocketService', `Error in handler for event "${event}":`, err);
      }
    }
  }
}

export const webSocketService = new WebSocketService();

