import React from 'react';
import { AddGroupMembersModal } from './components/AddGroupMembersModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { ConversationEmptyState } from './components/ConversationEmptyState';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ConversationWorkspace } from './components/ConversationWorkspace';
import { NewDirectChatModal } from './components/NewDirectChatModal';
import { NewGroupChatModal } from './components/NewGroupChatModal';
import { OwnerLeaveGroupModal } from './components/OwnerLeaveGroupModal';
import { RenameGroupModal } from './components/RenameGroupModal';
import { TransferOwnershipModal } from './components/TransferOwnershipModal';
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
          isError={controller.isConversationsError}
          onRetry={controller.handleRetryConversations}
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
          <ConversationWorkspace controller={controller} />
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 lg:static lg:z-auto lg:w-80 shrink-0 shadow-lg lg:shadow-none bg-card">
          <ConversationInfoPanel controller={controller} />
        </div>
      )}

      {/* Modals */}
      <NewDirectChatModal
        isOpen={controller.isNewDirectModalOpen}
        onClose={controller.handleCloseDirectModal}
        friends={controller.friends}
        isLoadingFriends={controller.isLoadingFriends}
        isFriendsError={controller.isFriendsError}
        onRetryFriends={controller.handleRetryFriends}
        isCreating={controller.isCreatingDirect}
        onSelectFriend={(friendId) => void controller.handleCreateDirect(friendId)}
      />

      <NewGroupChatModal
        isOpen={controller.isNewGroupModalOpen}
        onClose={controller.handleCloseGroupModal}
        currentUser={controller.currentUser}
        friends={controller.friends}
        isLoadingFriends={controller.isLoadingFriends}
        isFriendsError={controller.isFriendsError}
        onRetryFriends={controller.handleRetryFriends}
        isCreating={controller.isCreatingGroup}
        onSubmit={controller.handleCreateGroup}
      />

      {/* Group Management Modals */}
      <RenameGroupModal
        isOpen={controller.isRenameGroupModalOpen}
        onClose={controller.handleCloseRenameGroupModal}
        currentTitle={controller.activeConversation?.title || ''}
        isUpdating={controller.isUpdatingGroupTitle}
        onSubmit={controller.handleUpdateGroupTitle}
      />

      <AddGroupMembersModal
        isOpen={controller.isAddGroupMembersModalOpen}
        onClose={controller.handleCloseAddGroupMembersModal}
        friends={controller.friends}
        isLoadingFriends={controller.isLoadingFriends}
        isFriendsError={controller.isFriendsError}
        onRetryFriends={controller.handleRetryFriends}
        existingMemberUserIds={
          controller.activeConversation?.members?.map((m) => m.userId) || []
        }
        isAdding={controller.isAddingGroupMembers}
        onSubmit={controller.handleAddGroupMembers}
      />

      <TransferOwnershipModal
        isOpen={controller.isTransferOwnershipModalOpen}
        onClose={controller.handleCloseTransferOwnershipModal}
        members={controller.activeConversation?.members || []}
        currentUserId={controller.currentUser?.id}
        initialSelectedUserId={controller.transferTargetUserId}
        isTransferring={controller.isTransferringOwnership}
        onSubmit={controller.handleTransferOwnership}
      />

      <OwnerLeaveGroupModal
        isOpen={controller.isOwnerLeaveGroupModalOpen}
        onClose={controller.handleCloseOwnerLeaveGroupModal}
        members={controller.activeConversation?.members || []}
        currentUserId={controller.currentUser?.id}
        isLeaving={controller.isLeavingGroup}
        onSubmit={controller.handleOwnerLeaveGroup}
      />

      <ConfirmActionModal
        isOpen={controller.confirmModalState.isOpen}
        onClose={controller.handleCloseConfirmModal}
        onConfirm={controller.handleExecuteConfirmAction}
        title={
          controller.confirmModalState.type === 'KICK'
            ? 'Xác nhận xóa thành viên'
            : controller.confirmModalState.type === 'DISSOLVE'
            ? 'Giải tán nhóm trò chuyện'
            : 'Rời khỏi cuộc hội thoại nhóm'
        }
        description={
          controller.confirmModalState.type === 'KICK'
            ? `Bạn có chắc chắn muốn xóa "${
                controller.confirmModalState.targetUserName || 'thành viên này'
              }" ra khỏi nhóm không?`
            : controller.confirmModalState.type === 'DISSOLVE'
            ? 'Giải tán nhóm sẽ xóa vĩnh viễn cuộc trò chuyện này với toàn bộ thành viên. Hành động này không thể hoàn tác.\n\nBạn có chắc chắn muốn giải tán nhóm không?'
            : `Bạn có chắc chắn muốn rời khỏi nhóm "${
                controller.activeConversation?.title || 'này'
              }" không?`
        }
        confirmLabel={
          controller.confirmModalState.type === 'KICK'
            ? 'Xóa thành viên'
            : controller.confirmModalState.type === 'DISSOLVE'
            ? 'Giải tán nhóm'
            : 'Rời nhóm'
        }
        isDestructive={true}
        isLoading={
          controller.isRemovingGroupMember ||
          controller.isLeavingGroup ||
          controller.isDissolvingGroup
        }
      />
    </div>
  );
};

export default MessagesPage;
