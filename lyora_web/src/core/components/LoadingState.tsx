import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingStateProps {
  label?: string;
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-cards';
  count?: number;
  compact?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Đang tải dữ liệu...',
  variant = 'spinner',
  count = 3,
  compact = false,
  className = '',
}) => {
  if (variant === 'skeleton-list') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`space-y-3 ${className}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 animate-pulse"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/50" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 rounded-lg bg-secondary/50" />
              <div className="h-3 w-3/4 rounded-lg bg-border/70" />
            </div>
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'skeleton-cards') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`space-y-4 ${className}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/50" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-36 rounded-lg bg-secondary/50" />
                <div className="h-3 w-24 rounded-lg bg-border/70" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-full rounded-lg bg-border/70" />
              <div className="h-3.5 w-4/5 rounded-lg bg-border/70" />
            </div>
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-border bg-card ${
        compact ? 'px-4 py-6 gap-2' : 'px-6 py-10 gap-3'
      } ${className}`}
    >
      <LoadingSpinner size={compact ? 'sm' : 'md'} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
};
