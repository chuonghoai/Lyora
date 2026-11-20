import React from 'react';
import { ChatOutlineIcon, PlusIcon } from './ConversationIcons';

interface ConversationEmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({
  title = 'Chưa chọn cuộc hội thoại',
  description = 'Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu một cuộc hội thoại mới.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-card">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/60 text-primary mb-4">
        <ChatOutlineIcon className="h-10 w-10 text-primary" />
      </div>

      <h2 className="text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
