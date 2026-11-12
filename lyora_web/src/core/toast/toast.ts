import { useToastStore } from './toastStore';
import type { ShowToastOptions, ToastType } from './toast.types';

export const toast = {
  success(message: string, options?: ShowToastOptions): string {
    return useToastStore.getState().addToast('success', message, options);
  },
  error(message: string, options?: ShowToastOptions): string {
    return useToastStore.getState().addToast('error', message, options);
  },
  warning(message: string, options?: ShowToastOptions): string {
    return useToastStore.getState().addToast('warning', message, options);
  },
  info(message: string, options?: ShowToastOptions): string {
    return useToastStore.getState().addToast('info', message, options);
  },
  show(type: ToastType, message: string, options?: ShowToastOptions): string {
    return useToastStore.getState().addToast(type, message, options);
  },
  dismiss(id: string): void {
    useToastStore.getState().removeToast(id);
  },
  clear(): void {
    useToastStore.getState().clearToasts();
  },
};

