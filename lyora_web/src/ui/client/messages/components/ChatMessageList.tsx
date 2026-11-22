import React, { useEffect, useRef } from 'react';
import type { ConversationDetail } from '@/features/conversations';
import { ChatOutlineIcon } from './ConversationIcons';

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  isOutgoing?: boolean;
}

interface ChatMessageListProps {
  messages?: ChatMessageItem[];
  conversation: ConversationDetail | null;
  currentUserId?: string;
}

function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages = [],
  conversation,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation?.type === 'GROUP';

  // Tự động cuộn xuống đáy khi có tin nhắn mới hoặc đổi hội thoại
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-background min-h-0">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary mb-3 shadow-xs">
          <ChatOutlineIcon className="h-7 w-7" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          Chưa có tin nhắn nào
        </h4>
        <p className="mt-1 text-xs text-muted max-w-xs leading-relaxed">
          Tính năng gửi và nhận tin nhắn theo thời gian thực đang được phát triển.
        </p>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      aria-label="Vùng hiển thị tin nhắn"
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background min-h-0 focus-visible:outline-none"
    >
      {/* Date separator */}
      <div className="flex justify-center my-2">
        <span className="text-[11px] font-medium text-muted bg-card border border-border/80 rounded-full px-3 py-0.5 shadow-xs select-none">
          Hôm nay
        </span>
      </div>

      {messages.map((msg) => {
        const isOutgoing =
          msg.isOutgoing || (currentUserId && msg.senderId === currentUserId);
        const timeFormatted = formatMessageTime(msg.createdAt);

        if (isOutgoing) {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-on-primary shadow-xs break-words whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                {timeFormatted && (
                  <span className="mt-1 text-[10px] text-muted pr-1">
                    {timeFormatted}
                  </span>
                )}
              </div>
            </div>
          );
        }

        // Incoming message
        const senderInitial = (msg.senderName || 'L').charAt(0).toUpperCase();

        return (
          <div
            key={msg.id}
            className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%]"
          >
            {isGroup && (
              <div className="relative shrink-0 mt-0.5">
                {msg.senderAvatarUrl ? (
                  <img
                    src={msg.senderAvatarUrl}
                    alt={msg.senderName}
                    className="h-8 w-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary font-bold text-xs border border-border">
                    {senderInitial}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col items-start min-w-0">
              {isGroup && (
                <span className="text-[11px] font-semibold text-muted mb-1 ml-1 truncate max-w-full">
                  {msg.senderName}
                </span>
              )}
              <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-2.5 text-sm text-foreground shadow-xs break-words whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              {timeFormatted && (
                <span className="mt-1 text-[10px] text-muted pl-1">
                  {timeFormatted}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
};
