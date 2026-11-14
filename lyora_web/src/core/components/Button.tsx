import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-colors duration-150 rounded-lg px-4 py-2 text-sm disabled:bg-background disabled:text-muted/60 disabled:border-border disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card';

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
    secondary:
      'bg-secondary text-primary-active hover:bg-secondary-strong/50 active:bg-secondary-strong/70',
    outline:
      'border border-border text-foreground bg-card hover:bg-background',
    danger: 'bg-error text-on-primary hover:bg-error/90',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Đang xử lý...' : children}
    </button>
  );
};

