import React from 'react';
import type { ConversationDetail } from '@/features/conversations';
import { CloseIcon, UsersIcon } from './ConversationIcons';

interface ConversationInfoPanelProps {
  conversation: ConversationDetail | null;
  onClose: () => void;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  conversation,
  onClose,
}) => {
  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const initial = (conversation.title || 'L').charAt(0).toUpperCase();

  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(conversation.createdAt);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [conversation.createdAt]);

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card lg:w-72 shrink-0">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <h3 className="text-base font-semibold text-foreground">
          Thông tin hội thoại
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng thông tin"
          className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.title}
                className="h-20 w-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border border-border font-bold text-xl ${
                  isGroup
                    ? 'bg-secondary text-primary'
                    : 'bg-background text-foreground'
                }`}
              >
                {isGroup ? (
                  <UsersIcon className="h-10 w-10" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
            )}
          </div>

          <h4 className="mt-3 text-base font-bold text-foreground">
            {conversation.title}
          </h4>
          <span className="mt-0.5 text-xs text-muted">
            {isGroup ? 'Cuộc hội thoại nhóm' : 'Cuộc trò chuyện trực tiếp'}
          </span>
          <span className="mt-1 text-[11px] text-muted">
            Tạo ngày: {formattedDate}
          </span>
        </div>

        {/* Member List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Thành viên ({conversation.members?.length ?? 0})
            </h5>
          </div>

          <div className="space-y-2">
            {conversation.members?.map((member) => {
              const isOwner = member.role === 'OWNER';
              const memberInitial = (member.user?.fullName || 'U')
                .charAt(0)
                .toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {member.user?.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.fullName}
                          className="h-8 w-8 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 font-semibold text-xs text-primary">
                          {memberInitial}
                        </div>
                      )}
                      {member.user?.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success ring-1 ring-card" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {member.user?.fullName}
                      </p>
                      <span className="text-[10px] text-muted">
                        {member.user?.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  {isOwner ? (
                    <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Trưởng nhóm
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-muted">
                      Thành viên
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
