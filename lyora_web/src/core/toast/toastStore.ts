import { create } from 'zustand';
import type { ToastItem, ToastType, ShowToastOptions } from './toast.types';

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, options?: ShowToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const DEFAULT_DURATION = 4000;
const DEDUPLICATION_INTERVAL_MS = 1500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type, message, options) => {
    const now = Date.now();
    const currentToasts = get().toasts;

    // Deduplication check: ignore if the exact same message & type was added within the last 1500ms
    const isDuplicate = currentToasts.some(
      (t) => t.type === type && t.message === message && now - t.createdAt < DEDUPLICATION_INTERVAL_MS,
    );
    if (isDuplicate) {
      const existing = currentToasts.find((t) => t.type === type && t.message === message);
      return existing?.id || '';
    }

    const id = `toast_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const duration = options?.duration ?? DEFAULT_DURATION;

    const newToast: ToastItem = {
      id,
      type,
      message,
      title: options?.title,
      duration,
      createdAt: now,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

