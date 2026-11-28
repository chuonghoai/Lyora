import React from 'react';
import { Button } from './Button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-card ${
        compact ? 'px-4 py-6' : 'px-6 py-10'
      } ${className}`}
    >
      {icon && (
        <div
          className={`flex items-center justify-center rounded-full bg-secondary text-primary mb-3 ${
            compact ? 'h-10 w-10' : 'h-12 w-12'
          }`}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
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
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button
              type="button"
              variant={action.variant ?? 'primary'}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              variant={secondaryAction.variant ?? 'outline'}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
