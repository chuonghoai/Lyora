import React from 'react';
import { AppImage } from '@/core';
import type { ConversationSummary } from '@/features/conversations';
import { UserIcon, UsersIcon } from './ConversationIcons';

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onSelect,
}) => {
  const isGroup = conversation.type === 'GROUP';
  const isOnline = Boolean(conversation.directParticipant?.isOnline);

  const initial = (conversation.title || 'L').charAt(0).toUpperCase();

  const formattedTime = React.useMemo(() => {
    try {
      const date = new Date(conversation.updatedAt);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [conversation.updatedAt]);

  return (
    <button
      type="button"
      data-conversation-id={conversation.id}
      onClick={() => onSelect(conversation.id)}
      className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        isSelected
          ? 'bg-secondary text-primary font-semibold'
          : 'text-foreground hover:bg-background'
      }`}
      aria-selected={isSelected}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {conversation.avatarUrl ? (
          <AppImage
            src={conversation.avatarUrl}
            alt={conversation.title}
            rounded
            className="h-12 w-12 border border-border"
          />
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-border font-bold text-sm ${
              isGroup
                ? 'bg-secondary text-primary'
                : 'bg-background text-foreground'
            }`}
          >
            {isGroup ? (
              <UsersIcon className="h-6 w-6" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
        )}

        {/* Online dot for direct chats */}
        {!isGroup && isOnline && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-card"
            title="Đang hoạt động"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h3 className="truncate text-sm font-medium leading-tight">
            {conversation.title}
          </h3>
          <span className="shrink-0 text-[11px] text-muted">
            {formattedTime}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          {isGroup ? (
            <span className="inline-flex items-center gap-1 rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <UsersIcon className="h-3 w-3" />
              Nhóm ({conversation.memberCount})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <UserIcon className="h-3 w-3" />
              {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
