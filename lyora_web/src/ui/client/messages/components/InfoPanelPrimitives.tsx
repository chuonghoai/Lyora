import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './ConversationIcons';

export interface InfoPanelSectionProps {
  icon: React.ReactNode;
  title: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const InfoPanelSection: React.FC<InfoPanelSectionProps> = ({
  icon,
  title,
  badge,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`${title} (${isOpen ? 'Đang mở' : 'Đang đóng'})`}
        className="group flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-foreground hover:bg-background/80 transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-lg motion-reduce:transition-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-muted group-hover:text-primary transition-colors shrink-0 motion-reduce:transition-none">
            {icon}
          </span>
          <span className="truncate text-xs font-semibold text-foreground">
            {title}
          </span>
          {badge !== undefined && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums shrink-0">
              {badge}
            </span>
          )}
        </div>
        <span className="text-muted group-hover:text-foreground transition-colors shrink-0 ml-2 motion-reduce:transition-none">
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-3.5 pt-1 text-xs text-muted space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

export interface QuickActionItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export const QuickActionItem: React.FC<QuickActionItemProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  title,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
      className={`group flex flex-col items-center gap-1.5 p-1 rounded-xl min-h-[44px] min-w-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-xl cursor-pointer motion-reduce:transition-none ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:text-primary active:scale-95 motion-reduce:scale-100'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-2xs motion-reduce:transition-none">
        {icon}
      </div>
      <span className="text-[11px] font-medium leading-tight text-center text-foreground group-hover:text-primary transition-colors line-clamp-2 max-w-[72px] break-words motion-reduce:transition-none">
        {label}
      </span>
    </button>
  );
};
