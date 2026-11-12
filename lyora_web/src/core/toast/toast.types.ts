export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  createdAt: number;
}

export interface ShowToastOptions {
  title?: string;
  duration?: number;
}

