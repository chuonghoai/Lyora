export type WebSocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface WebSocketConfig {
  url?: string;
  heartbeatIntervalMs?: number;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  reconnectBackoffMultiplier?: number;
  maxReconnectIntervalMs?: number;
}

export type WebSocketEventHandler<T = unknown> = (data: T) => void;

export interface WebSocketMessage<T = unknown> {
  event: string;
  data: T;
  timestamp?: string;
}

