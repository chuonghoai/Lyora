import React from 'react';
import { useToastStore } from './toastStore';
import type { ToastItem, ToastType } from './toast.types';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-5 h-5 text-info shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const typeRing = {
    success: 'border-success/30',
    error: 'border-error/30',
    warning: 'border-warning/30',
    info: 'border-info/30',
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-2xl bg-card p-4 shadow-md border ${typeRing} transition-[opacity,transform] duration-150`}
    >
      <div className="mt-0.5">
        <ToastIcon type={toast.type} />
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-foreground mb-0.5 leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-sm text-muted leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-muted hover:text-foreground hover:bg-background transition-colors p-1 rounded-lg cursor-pointer -mr-1 -mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Đóng thông báo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Khu vực thông báo hệ thống"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={removeToast} />
      ))}
    </aside>
  );
};

