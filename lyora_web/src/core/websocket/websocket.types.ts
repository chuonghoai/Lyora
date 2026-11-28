export type WebSocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface WebSocketConfig {
  url?: string;
  maxReconnectAttempts?: number;
}

export type WebSocketEventHandler<T = unknown> = (data: T) => void;

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

