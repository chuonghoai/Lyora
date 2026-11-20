import React from 'react';
import { ConversationEmptyState } from './components/ConversationEmptyState';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ConversationWorkspace } from './components/ConversationWorkspace';
import { NewDirectChatModal } from './components/NewDirectChatModal';
import { NewGroupChatModal } from './components/NewGroupChatModal';
import { useMessagesController } from './messages.controller';

export const MessagesPage: React.FC = () => {
  const controller = useMessagesController();

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* 1. Left Sidebar: Hidden on mobile when viewing detail */}
      <div
        className={`${
          controller.activeView === 'detail' ? 'hidden md:flex' : 'flex'
        } h-full w-full md:w-80 shrink-0`}
      >
        <ConversationSidebar
          conversations={controller.conversations}
          selectedId={controller.selectedConversationId}
          onSelect={controller.handleSelectConversation}
          isLoading={controller.isLoadingConversations}
          filterType={controller.filterType}
          onFilterChange={controller.setFilterType}
          searchQuery={controller.searchQuery}
          onSearchChange={controller.setSearchQuery}
          onOpenDirectModal={controller.handleOpenDirectModal}
          onOpenGroupModal={controller.handleOpenGroupModal}
        />
      </div>

      {/* 2. Main Workspace: Hidden on mobile when viewing list */}
      <div
        className={`${
          controller.activeView === 'list' ? 'hidden md:flex' : 'flex'
        } h-full flex-1 min-w-0`}
      >
        {controller.selectedConversationId ? (
          <ConversationWorkspace
            conversation={controller.activeConversation}
            isLoading={controller.isLoadingActiveConversation}
            onBackToList={controller.handleBackToList}
            isInfoPanelOpen={controller.isInfoPanelOpen}
            onToggleInfoPanel={controller.handleToggleInfoPanel}
          />
        ) : (
          <ConversationEmptyState
            title="Chưa chọn cuộc hội thoại"
            description="Hãy chọn một cuộc hội thoại từ danh sách hoặc bắt đầu cuộc trò chuyện mới với bạn bè của bạn."
            actionText="Bắt đầu trò chuyện"
            onAction={controller.handleOpenDirectModal}
          />
        )}
      </div>

      {/* 3. Right Info Panel: Collapsible on desktop, full modal on mobile if open */}
      {controller.isInfoPanelOpen && controller.selectedConversationId && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 lg:static lg:z-auto lg:w-72 shrink-0 shadow-lg lg:shadow-none bg-card">
          <ConversationInfoPanel
            conversation={controller.activeConversation}
            onClose={controller.handleCloseInfoPanel}
          />
        </div>
      )}

      {/* Modals */}
      <NewDirectChatModal
        isOpen={controller.isNewDirectModalOpen}
        onClose={controller.handleCloseDirectModal}
        friends={controller.friends}
        isLoadingFriends={controller.isLoadingFriends}
        isCreating={controller.isCreatingDirect}
        onSelectFriend={controller.handleCreateDirect}
      />

      <NewGroupChatModal
        isOpen={controller.isNewGroupModalOpen}
        onClose={controller.handleCloseGroupModal}
        friends={controller.friends}
        isLoadingFriends={controller.isLoadingFriends}
        isCreating={controller.isCreatingGroup}
        onSubmit={controller.handleCreateGroup}
      />
    </div>
  );
};

export default MessagesPage;
