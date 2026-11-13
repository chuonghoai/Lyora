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
    'inline-flex items-center justify-center font-semibold transition-colors duration-150 rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles = {
    primary:
      'bg-[#863bff] text-white hover:bg-[#6d28d9] shadow-md shadow-purple-500/30',
    secondary:
      'bg-[#aa3bff]/10 text-[#aa3bff] border border-[#aa3bff]/50 hover:bg-[#aa3bff]/20',
    outline:
      'border border-[#cbd5e1] text-[#334155] bg-white hover:bg-[#f8fafc]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
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

