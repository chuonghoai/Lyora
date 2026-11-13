import React from 'react';
import { Input, type InputProps } from '@/core';

export const FormAlert: React.FC<{ message: string }> = ({ message }) => (
  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="font-medium">{message}</p>
  </div>
);

interface PasswordFieldProps extends Omit<InputProps, 'type' | 'endAdornment'> {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  isVisible,
  onToggleVisibility,
  ...props
}) => (
  <Input
    {...props}
    type={isVisible ? 'text' : 'password'}
    endAdornment={
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
        aria-pressed={isVisible}
        className="grid h-11 w-11 place-items-center rounded-xl text-[#625a7b] transition-colors hover:bg-violet-50 hover:text-[#5b08d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#863bff]"
      >
        {isVisible ? (
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    }
  />
);

interface AuthProgressProps {
  steps: string[];
  currentStep: number;
}

export const AuthProgress: React.FC<AuthProgressProps> = ({ steps, currentStep }) => (
  <nav aria-label="Tiến trình khôi phục mật khẩu">
    <ol className="flex items-center gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const complete = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <React.Fragment key={step}>
            {index > 0 && <span aria-hidden="true" className={`h-px flex-1 ${stepNumber <= currentStep ? 'bg-[#863bff]' : 'bg-violet-100'}`} />}
            <li className="flex min-w-0 items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${complete || active ? 'bg-[#863bff] text-white' : 'bg-violet-100 text-[#716889]'}`}>
                {complete ? '✓' : stepNumber}
              </span>
              <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-[#2d0d64]' : 'text-[#716889]'}`}>{step}</span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  </nav>
);
