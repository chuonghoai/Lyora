import React from 'react';
import type { ConversationDetail } from '@/features/conversations';
import {
  ArrowLeftIcon,
  ChatOutlineIcon,
  InfoIcon,
  ShieldCheckIcon,
  UsersIcon,
} from './ConversationIcons';

interface ConversationWorkspaceProps {
  conversation: ConversationDetail | null;
  isLoading: boolean;
  onBackToList: () => void;
  isInfoPanelOpen: boolean;
  onToggleInfoPanel: () => void;
}

export const ConversationWorkspace: React.FC<ConversationWorkspaceProps> = ({
  conversation,
  isLoading,
  onBackToList,
  isInfoPanelOpen,
  onToggleInfoPanel,
}) => {
  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background animate-pulse">
        <div className="h-16 border-b border-border bg-card p-4" />
        <div className="flex-1 p-6" />
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const isGroup = conversation.type === 'GROUP';
  const initial = (conversation.title || 'L').charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-1 flex-col bg-background min-w-0">
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBackToList}
            aria-label="Quay lại danh sách hội thoại"
            className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors cursor-pointer md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.title}
                className="h-10 w-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-border font-bold text-sm ${
                  isGroup
                    ? 'bg-secondary text-primary'
                    : 'bg-background text-foreground'
                }`}
              >
                {isGroup ? (
                  <UsersIcon className="h-5 w-5" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
            )}
          </div>

          {/* Title & Status */}
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground leading-tight">
              {conversation.title}
            </h2>
            <p className="text-xs text-muted">
              {isGroup
                ? `${conversation.members?.length ?? 0} thành viên`
                : 'Hội thoại trực tiếp'}
            </p>
          </div>
        </div>

        {/* Right Action: Toggle Info Panel */}
        <button
          type="button"
          onClick={onToggleInfoPanel}
          aria-label={
            isInfoPanelOpen
              ? 'Đóng bảng thông tin'
              : 'Xem thông tin hội thoại'
          }
          className={`group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            isInfoPanelOpen
              ? 'text-primary'
              : 'text-foreground hover:text-primary'
          }`}
        >
          <InfoIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Main Workspace Body — Zero mock messages! */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary mb-4">
            <ChatOutlineIcon className="h-8 w-8 text-primary" />
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {conversation.title}
          </h3>

          <p className="mt-1 text-xs text-muted">
            {isGroup
              ? `Nhóm trò chuyện được bảo mật với ${conversation.members?.length ?? 0} thành viên.`
              : 'Cuộc hội thoại trực tiếp được mã hóa và bảo mật an toàn.'}
          </p>

          <div className="mt-6 rounded-xl bg-background p-4 border border-border/60 text-left">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <ShieldCheckIcon className="h-5 w-5 shrink-0" />
              <span>Chế độ Quản lý Hội thoại</span>
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Bạn đang ở giao diện quản lý hội thoại. Tại đây bạn có thể xem chi tiết thông tin phòng chat, kiểm tra danh sách thành viên và vai trò trong nhóm.
            </p>
            <p className="mt-2 text-[11px] text-muted italic">
              * Tính năng gửi và nhận tin nhắn trực tiếp sẽ được kích hoạt ở giai đoạn tiếp theo của dự án Lyora.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
