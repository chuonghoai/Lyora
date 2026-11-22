import React from 'react';
import { toast } from '@/core';
import type { ConversationDetail } from '@/features/conversations';
import type { MessagesController } from '../messages.controller';
import {
  BellOffIcon,
  CalendarIcon,
  ClipboardListIcon,
  CloseIcon,
  CrownIcon,
  FileIcon,
  ImageIcon,
  LinkIcon,
  LogOutIcon,
  PencilIcon,
  PinIcon,
  SettingsIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from './ConversationIcons';
import { InfoPanelSection, QuickActionItem } from './InfoPanelPrimitives';

export interface GroupConversationInfoPanelProps {
  conversation: ConversationDetail;
  onClose: () => void;
  currentUserId?: string;
  controller?: MessagesController;
}

export const GroupConversationInfoPanel: React.FC<
  GroupConversationInfoPanelProps
> = ({ conversation, onClose, currentUserId, controller }) => {
  const memberCount = conversation.members?.length ?? 0;
  const initial = (conversation.title || 'G').charAt(0).toUpperCase();

  const callerMembership = conversation.members?.find(
    (m) => m.userId === currentUserId,
  );
  const isCallerOwner = callerMembership?.role === 'OWNER';

  const handlePreviewAction = (actionName: string) => {
    toast.info(`${actionName}: Tính năng đang phát triển`);
  };

  const handleRenameClick = () => {
    if (isCallerOwner && controller) {
      controller.handleOpenRenameGroupModal();
    } else if (!isCallerOwner) {
      toast.info('Chỉ Trưởng nhóm mới có quyền đổi tên nhóm');
    } else {
      handlePreviewAction('Đổi tên nhóm');
    }
  };

  const handleAddMemberClick = () => {
    if (isCallerOwner && controller) {
      controller.handleOpenAddGroupMembersModal();
    } else if (!isCallerOwner) {
      toast.info('Chỉ Trưởng nhóm mới có quyền thêm thành viên vào nhóm');
    } else {
      handlePreviewAction('Thêm bạn vào nhóm');
    }
  };

  return (
    <aside
      aria-label="Thông tin hội thoại nhóm"
      className="flex h-full w-full flex-col border-l border-border bg-card lg:w-80 shrink-0"
    >
      {/* A. Header block */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <h3 className="text-base font-semibold text-foreground">
          Thông tin nhóm
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
        {/* B. Group summary */}
        <div className="flex flex-col items-center text-center p-5 border-b border-border/70">
          <div className="relative">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.title}
                className="h-20 w-20 rounded-full object-cover border border-border shadow-xs"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-secondary font-bold text-2xl text-primary shadow-xs">
                {initial ? (
                  <span>{initial}</span>
                ) : (
                  <UsersIcon className="h-10 w-10" />
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 max-w-full px-2">
            <h4
              title={conversation.title}
              className="truncate max-w-[220px] text-base font-bold text-foreground"
            >
              {conversation.title}
            </h4>
            <button
              type="button"
              onClick={handleRenameClick}
              title={
                isCallerOwner
                  ? 'Đổi tên nhóm'
                  : 'Chỉ Trưởng nhóm mới có quyền đổi tên nhóm'
              }
              aria-label="Đổi tên nhóm"
              className={`p-1 rounded-md min-h-[32px] min-w-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none transition-colors cursor-pointer ${
                isCallerOwner
                  ? 'text-muted hover:text-primary hover:bg-primary/5'
                  : 'text-muted/40 cursor-not-allowed'
              }`}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="mt-0.5 text-xs text-muted">
            Nhóm trò chuyện • {memberCount} thành viên
          </p>
        </div>

        {/* C. Quick actions row (4 actions) */}
        <div className="grid grid-cols-4 gap-1 px-2 py-4 border-b border-border/70 bg-card">
          <QuickActionItem
            icon={<BellOffIcon className="h-4.5 w-4.5" />}
            label="Tắt thông báo"
            title="Tắt thông báo nhóm (Tính năng đang phát triển)"
            onClick={() => handlePreviewAction('Tắt thông báo')}
          />
          <QuickActionItem
            icon={<PinIcon className="h-4.5 w-4.5" />}
            label="Ghim hội thoại"
            title="Ghim nhóm lên đầu (Tính năng đang phát triển)"
            onClick={() => handlePreviewAction('Ghim hội thoại')}
          />
          <QuickActionItem
            icon={<UserPlusIcon className="h-4.5 w-4.5" />}
            label="Thêm bạn"
            title={
              isCallerOwner
                ? 'Thêm thành viên vào nhóm'
                : 'Chỉ Trưởng nhóm mới có quyền thêm thành viên'
            }
            onClick={handleAddMemberClick}
          />
          <QuickActionItem
            icon={<SettingsIcon className="h-4.5 w-4.5" />}
            label="Quản lý"
            title="Quản lý cài đặt nhóm (Tính năng đang phát triển)"
            onClick={() => handlePreviewAction('Quản lý cài đặt nhóm')}
          />
        </div>

        {/* D. Group sections (Collapsible blocks) */}
        <div className="divide-y divide-border/60">
          {/* 1. Thành viên nhóm (Mặc định mở) */}
          <InfoPanelSection
            icon={<UsersIcon className="h-4 w-4" />}
            title="Thành viên nhóm"
            badge={memberCount}
            defaultOpen={true}
          >
            <div className="space-y-1.5 pt-1">
              {conversation.members?.map((member) => {
                const isOwner = member.role === 'OWNER';
                const isMe = member.userId === currentUserId;
                const memberInitial = (member.user?.fullName || 'U')
                  .charAt(0)
                  .toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-background/80 transition-colors"
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
                      </div>

                      <div className="min-w-0">
                        <p
                          title={member.user?.fullName}
                          className="truncate max-w-[140px] text-xs font-medium text-foreground"
                        >
                          {member.user?.fullName}
                          {isMe && (
                            <span className="ml-1 text-[10px] text-muted font-normal">
                              (Bạn)
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-muted">
                          {isOwner ? 'Trưởng nhóm' : 'Thành viên'}
                        </span>
                      </div>
                    </div>

                    {/* Role Badge & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOwner ? (
                        <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Trưởng nhóm
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted">
                          Thành viên
                        </span>
                      )}

                      {/* Thao tác của Trưởng nhóm trên thành viên khác */}
                      {isCallerOwner && !isMe && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() =>
                              controller?.handleOpenTransferOwnershipModal()
                            }
                            title="Chuyển quyền Trưởng nhóm"
                            aria-label={`Chuyển quyền Trưởng nhóm cho ${member.user?.fullName}`}
                            className="p-1 rounded text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
                          >
                            <CrownIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              controller?.handleOpenKickMemberModal(
                                member.userId,
                                member.user?.fullName || 'thành viên',
                              )
                            }
                            title="Xóa khỏi nhóm"
                            aria-label={`Xóa ${member.user?.fullName} khỏi nhóm`}
                            className="p-1 rounded text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
                          >
                            <UserMinusIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </InfoPanelSection>

          {/* 2. Bảng tin nhóm */}
          <InfoPanelSection
            icon={<ClipboardListIcon className="h-4 w-4" />}
            title="Bảng tin nhóm"
          >
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xs text-foreground">
                    Danh sách nhắc hẹn
                  </span>
                </div>
                <span className="text-[10px] text-muted">0 nhắc hẹn</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="flex items-center gap-2">
                  <PinIcon className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xs text-foreground">
                    Ghi chú & Ghim
                  </span>
                </div>
                <span className="text-[10px] text-muted">Chưa có ghim</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="flex items-center gap-2">
                  <ClipboardListIcon className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xs text-foreground">Bình chọn</span>
                </div>
                <span className="text-[10px] text-muted">0 bình chọn</span>
              </div>
            </div>
          </InfoPanelSection>

          {/* 3. Ảnh/Video */}
          <InfoPanelSection
            icon={<ImageIcon className="h-4 w-4" />}
            title="Ảnh / Video"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có hình ảnh hoặc video nào được chia sẻ trong nhóm.
            </div>
          </InfoPanelSection>

          {/* 4. Tệp tin */}
          <InfoPanelSection
            icon={<FileIcon className="h-4 w-4" />}
            title="Tệp tin"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có tệp tin nào được chia sẻ trong nhóm.
            </div>
          </InfoPanelSection>

          {/* 5. Liên kết */}
          <InfoPanelSection
            icon={<LinkIcon className="h-4 w-4" />}
            title="Liên kết"
            badge="0"
          >
            <div className="py-2.5 text-center text-xs text-muted bg-background/50 rounded-lg p-3 border border-border/40">
              Chưa có đường dẫn liên kết web nào được chia sẻ trong nhóm.
            </div>
          </InfoPanelSection>
        </div>

        {/* E. Action Zone */}
        <div className="p-4 space-y-2 border-t border-border/80 bg-card">
          <button
            type="button"
            onClick={() => {
              if (isCallerOwner) {
                controller?.handleOpenOwnerLeaveGroupModal();
              } else {
                controller?.handleOpenMemberLeaveModal();
              }
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border text-error hover:bg-error/5 hover:border-error/30 font-semibold text-xs transition-colors cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Rời khỏi nhóm</span>
          </button>

          {isCallerOwner && (
            <button
              type="button"
              onClick={() => controller?.handleOpenDissolveGroupModal()}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-error/10 text-error hover:bg-error/15 font-semibold text-xs transition-colors cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Giải tán nhóm</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
