import { create } from 'zustand';
import type { WebSocketStatus } from './websocket.types';
import { webSocketService } from './WebSocketService';

interface WebSocketStoreState {
  status: WebSocketStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocketStore = create<WebSocketStoreState>((set) => {
  // Synchronize store with service status
  webSocketService.onStatusChange((status) => {
    set({
      status,
      isConnected: status === 'CONNECTED',
    });
  });

  return {
    status: webSocketService.getStatus(),
    isConnected: webSocketService.isConnected(),
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
  };
});

