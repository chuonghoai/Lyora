import React from 'react';
import { AppImage, ErrorState } from '@/core';
import type { MessagesController } from '../messages.controller';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import {
  ArrowLeftIcon,
  InfoIcon,
  UsersIcon,
} from './ConversationIcons';

export interface ConversationWorkspaceProps {
  controller: MessagesController;
}

export const ConversationWorkspace: React.FC<ConversationWorkspaceProps> = ({
  controller,
}) => {
  const conversation = controller.activeConversation;
  const isLoading = controller.isLoadingActiveConversation;
  const isError = controller.isActiveConversationError;
  const onBackToList = controller.handleBackToList;
  const isInfoPanelOpen = controller.isInfoPanelOpen;
  const onToggleInfoPanel = controller.handleToggleInfoPanel;

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background animate-pulse">
        <div className="h-16 border-b border-border bg-card p-4" />
        <div className="flex-1 p-6" />
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button
            type="button"
            onClick={onBackToList}
            aria-label="Quay lại danh sách hội thoại"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold text-foreground">Hội thoại</span>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorState
            title="Không thể tải cuộc hội thoại"
            description="Cuộc hội thoại có thể không tồn tại hoặc kết nối tạm thời gián đoạn."
            onRetry={controller.handleRetryActiveConversation}
            secondaryAction={{
              label: 'Quay lại danh sách',
              onClick: onBackToList,
            }}
            className="w-full max-w-md"
          />
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === 'GROUP';
  const initial = (conversation.title || 'L').charAt(0).toUpperCase();
  const directPartnerId = !isGroup
    ? conversation.members?.find((m) => m.userId !== controller.currentUser?.id)?.userId ??
      conversation.members?.[0]?.userId
    : undefined;

  return (
    <div className="flex h-full flex-1 flex-col bg-background min-w-0">
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 z-10 shadow-xs">
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

          {!isGroup && directPartnerId ? (
            <button
              type="button"
              onClick={() => controller.handleOpenUserProfile(directPartnerId)}
              title={`Xem hồ sơ của ${conversation.title}`}
              className="group flex items-center gap-3 min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="relative shrink-0">
                {conversation.avatarUrl ? (
                  <AppImage
                    src={conversation.avatarUrl}
                    alt={conversation.title}
                    rounded
                    className="h-10 w-10 border border-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border font-bold text-sm bg-background text-foreground">
                    <span>{initial}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground group-hover:text-primary group-hover:underline leading-tight">
                  {conversation.title}
                </h2>
                <p className="text-xs text-muted">Hội thoại trực tiếp</p>
              </div>
            </button>
          ) : (
            <>
              {/* Avatar */}
              <div className="relative shrink-0">
                {conversation.avatarUrl ? (
                  <AppImage
                    src={conversation.avatarUrl}
                    alt={conversation.title}
                    rounded
                    className="h-10 w-10 border border-border"
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
            </>
          )}
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

      {/* Main Workspace: Messages Display Area */}
      <ChatMessageList
        messages={controller.activeMessages}
        conversation={conversation}
        currentUserId={controller.currentUser?.id}
        onOpenUserProfile={controller.handleOpenUserProfile}
      />

      {/* Bottom Area: Chat Composer */}
      <ChatComposer
        text={controller.composerText}
        onChange={controller.handleComposerTextChange}
        onKeyDown={controller.handleComposerKeyDown}
        disabled
      />
    </div>
  );
};
