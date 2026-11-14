import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  endAdornment?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  endAdornment,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText && !error ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-card placeholder:text-muted focus:outline-none focus:ring-2 disabled:bg-background disabled:text-muted/60 disabled:cursor-not-allowed transition-colors duration-150 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
            error
              ? 'border-error focus:border-error focus:ring-error/25'
              : 'border-border focus:border-primary focus:ring-primary/40'
          } ${endAdornment ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <span id={errorId} className="text-xs text-error" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="text-xs text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
};
