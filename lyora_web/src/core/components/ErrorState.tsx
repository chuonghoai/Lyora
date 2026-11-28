import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Không thể tải dữ liệu',
  description = 'Đã xảy ra sự cố khi kết nối đến hệ thống. Vui lòng thử lại.',
  onRetry,
  retryLabel = 'Thử lại',
  isRetrying = false,
  secondaryAction,
  compact = false,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-error/30 bg-card ${
        compact ? 'px-4 py-6' : 'px-6 py-10'
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-error/10 text-error mb-3 ${
          compact ? 'h-10 w-10' : 'h-12 w-12'
        }`}
        aria-hidden="true"
      >
        <svg
          className={compact ? 'h-5 w-5' : 'h-6 w-6'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3
        className={`font-semibold text-foreground ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`mt-1.5 max-w-md text-muted leading-relaxed ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {description}
        </p>
      )}
      {(onRetry || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              isLoading={isRetrying}
            >
              {retryLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
