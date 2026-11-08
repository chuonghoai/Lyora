import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#334155]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-[#0f172a] bg-white placeholder-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150 ${
          error ? 'border-red-500' : 'border-[#cbd5e1]'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {!error && helperText && (
        <span className="text-xs text-[#64748b]">{helperText}</span>
      )}
    </div>
  );
};
