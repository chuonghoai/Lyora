import React from 'react';
import { EmptyState } from '@/core';
import { ChatOutlineIcon } from './ConversationIcons';

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
    <div className="flex h-full w-full items-center justify-center p-8 bg-card">
      <EmptyState
        icon={<ChatOutlineIcon className="h-7 w-7" />}
        title={title}
        description={description}
        className="w-full max-w-md border-none bg-transparent"
        action={
          actionText && onAction
            ? {
                label: actionText,
                variant: 'primary',
                onClick: onAction,
              }
            : undefined
        }
      />
    </div>
  );
};
