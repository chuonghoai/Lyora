import React, { useMemo } from 'react';
import { toast } from '@/core';
import type { ConversationDetail, ConversationSummary } from '@/features/conversations';
import {
  BellOffIcon,
  CalendarIcon,
  CloseIcon,
  FileIcon,
  ImageIcon,
  LinkIcon,
  PencilIcon,
  PinIcon,
  UsersIcon,
} from './ConversationIcons';
import { InfoPanelSection, QuickActionItem } from './InfoPanelPrimitives';

export interface DirectConversationInfoPanelProps {
  conversation: ConversationDetail;
  onClose: () => void;
  currentUserId?: string;
  conversations?: ConversationSummary[];
  onOpenGroupModal?: () => void;
}

export const DirectConversationInfoPanel: React.FC<
  DirectConversationInfoPanelProps
> = ({
  conversation,
  onClose,
  currentUserId,
  onOpenGroupModal,
}) => {
  // Trích xuất thông tin người bạn đối thoại từ members hoặc directParticipant
  const partner = useMemo(() => {
    if (conversation.members && conversation.members.length > 0) {
      const other = conversation.members.find(
        (m) => m.userId !== currentUserId,
      );
      if (other?.user) return other.user;
      return conversation.members[0].user;
    }
    return null;
  }, [conversation.members, currentUserId]);

  const displayName = partner?.fullName || conversation.title || 'Người dùng';
  const displayAvatar = partner?.avatarUrl || conversation.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const handlePreviewAction = (actionName: string) => {
    toast.info(`${actionName}: Tính năng đang phát triển`);
  };

  return (
    <aside
      aria-label="Thông tin hội thoại trực tiếp"
      className="flex h-full w-full flex-col border-l border-border bg-card lg:w-80 shrink-0"
    >
      {/* A. Header block */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <h3 className="text-base font-semibold text-foreground">
          Thông tin hội thoại
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng thông tin"
          className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-lg motion-reduce:transition-none"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Independent scroll content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* B. Profile summary */}
        <div className="flex flex-col items-center text-center p-5 border-b border-border/70">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border border-border shadow-xs"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-secondary font-bold text-2xl text-primary shadow-xs">
                {initial}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 max-w-full px-2">
            <h4
              title={displayName}
              className="truncate max-w-[220px] text-base font-bold text-foreground"
            >
              {displayName}
            </h4>
            <button
              type="button"
              onClick={() => handlePreviewAction('Chỉnh sửa biệt danh')}
              title="Chỉnh sửa biệt danh (Tính năng đang phát triển)"
              aria-label="Chỉnh sửa biệt danh (Tính năng đang phát triển)"
              className="text-muted/60 hover:text-primary transition-colors cursor-pointer p-1 rounded-md min-h-[32px] min-w-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="mt-0.5 text-xs text-muted">
            Hội thoại trực tiếp
          </p>
        </div>

        {/* C. Quick actions row (3 actions) */}
        <div className="grid grid-cols-3 gap-2 px-4 py-4 border-b border-border/70 bg-card">
          <QuickActionItem
            icon={<BellOffIcon className="h-5 w-5" />}
            label="Tắt thông báo"
            title="Tắt thông báo hội thoại (Tính năng đang phát triển)"
            onClick={() => handlePreviewAction('Tắt thông báo')}
          />
          <QuickActionItem
            icon={<PinIcon className="h-5 w-5" />}
            label="Ghim hội thoại"
            title="Ghim hội thoại lên đầu (Tính năng đang phát triển)"
            onClick={() => handlePreviewAction('Ghim hội thoại')}
          />
          <QuickActionItem
            icon={<UsersIcon className="h-5 w-5" />}
            label="Tạo nhóm"
            onClick={
              onOpenGroupModal || (() => handlePreviewAction('Tạo nhóm trò chuyện'))
            }
            title="Tạo nhóm trò chuyện cùng người này"
          />
        </div>

        {/* D. Info sections (Collapsible blocks) */}
        <div className="divide-y divide-border/60">
          {/* 1. Danh sách nhắc hẹn */}
          <InfoPanelSection
            icon={<CalendarIcon className="h-4 w-4" />}
            title="Danh sách nhắc hẹn"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có lời nhắc hẹn nào được thiết lập giữa hai bạn.
            </div>
          </InfoPanelSection>

          {/* 2. Nhóm chung */}
          <InfoPanelSection
            icon={<UsersIcon className="h-4 w-4" />}
            title="Nhóm chung"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Tính năng tìm kiếm nhóm chung hiện chưa được hỗ trợ.
            </div>
          </InfoPanelSection>

          {/* 3. Ảnh/Video */}
          <InfoPanelSection
            icon={<ImageIcon className="h-4 w-4" />}
            title="Ảnh / Video"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có hình ảnh hoặc video nào được chia sẻ trong hội thoại này.
            </div>
          </InfoPanelSection>

          {/* 4. Tệp tin */}
          <InfoPanelSection
            icon={<FileIcon className="h-4 w-4" />}
            title="Tệp tin"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có tệp tin nào được gửi qua lại.
            </div>
          </InfoPanelSection>

          {/* 5. Liên kết */}
          <InfoPanelSection
            icon={<LinkIcon className="h-4 w-4" />}
            title="Liên kết"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có đường dẫn liên kết web nào được chia sẻ.
            </div>
          </InfoPanelSection>
        </div>
      </div>
    </aside>
  );
};
