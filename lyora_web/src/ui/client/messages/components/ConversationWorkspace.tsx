import React from 'react';
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

  if (!conversation) {
    return null;
  }

  const isGroup = conversation.type === 'GROUP';
  const initial = (conversation.title || 'L').charAt(0).toUpperCase();

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

      {/* Main Workspace: Messages Display Area */}
      <ChatMessageList
        messages={controller.activeMessages}
        conversation={conversation}
        currentUserId={controller.currentUser?.id}
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
