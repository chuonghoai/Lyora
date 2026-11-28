import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore, useDebounce } from '@/core';
import { getClientProfilePath } from '@/routes/paths';
import {
  useAddGroupMembersMutation,
  useConversationDetailQuery,
  useConversationFriendsQuery,
  useConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,
  useDissolveGroupMutation,
  useLeaveGroupMutation,
  useRemoveGroupMemberMutation,
  useTransferGroupOwnershipMutation,
  useUpdateGroupTitleMutation,
  type ConversationSummary,
  type ConversationType,
} from '@/features/conversations';
import type { ChatMessageItem } from './components/ChatMessageList';

export type MessagesFilterType = 'ALL' | ConversationType;
export type MessagesActiveView = 'list' | 'detail';

export function useMessagesController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [transferTargetUserId, setTransferTargetUserId] = useState<
    string | null
  >(null);
  const [filterType, setFilterType] = useState<MessagesFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<MessagesActiveView>('list');
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);

  // Group Management Modals state
  const [isRenameGroupModalOpen, setIsRenameGroupModalOpen] = useState(false);
  const [isAddGroupMembersModalOpen, setIsAddGroupMembersModalOpen] =
    useState(false);
  const [isTransferOwnershipModalOpen, setIsTransferOwnershipModalOpen] =
    useState(false);
  const [isOwnerLeaveGroupModalOpen, setIsOwnerLeaveGroupModalOpen] =
    useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    type: 'KICK' | 'LEAVE' | 'DISSOLVE' | null;
    targetUserId?: string;
    targetUserName?: string;
  }>({
    isOpen: false,
    type: null,
  });

  const currentUser = useAuthStore((s) => s.user);
  const [composerText, setComposerText] = useState('');

  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  // Queries
  const conversationsQuery = useConversationsQuery({
    type: filterType === 'ALL' ? undefined : filterType,
    search: debouncedSearch || undefined,
  });

  const activeConversationQuery = useConversationDetailQuery(
    selectedConversationId,
  );

  const friendsQuery = useConversationFriendsQuery();

  useEffect(() => {
    const requestedConversationId = searchParams.get('conversationId');
    if (!requestedConversationId) return;

    setSelectedConversationId(requestedConversationId);
    setActiveView('detail');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('conversationId');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Mutations
  const createDirectMutation = useCreateDirectConversationMutation();
  const createGroupMutation = useCreateGroupConversationMutation();
  const updateGroupTitleMutation = useUpdateGroupTitleMutation();
  const addGroupMembersMutation = useAddGroupMembersMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();
  const transferOwnershipMutation = useTransferGroupOwnershipMutation();
  const leaveGroupMutation = useLeaveGroupMutation();
  const dissolveGroupMutation = useDissolveGroupMutation();

  const conversations = useMemo<ConversationSummary[]>(() => {
    return conversationsQuery.data ?? [];
  }, [conversationsQuery.data]);

  const friends = useMemo(() => {
    return friendsQuery.data ?? [];
  }, [friendsQuery.data]);

  // Select conversation
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setActiveView('detail');
    setComposerText('');
  }, []);

  // Back to list (Mobile)
  const handleBackToList = useCallback(() => {
    setActiveView('list');
  }, []);

  // Toggle Info Panel
  const handleToggleInfoPanel = useCallback(() => {
    setIsInfoPanelOpen((prev) => !prev);
  }, []);

  const handleCloseInfoPanel = useCallback(() => {
    setIsInfoPanelOpen(false);
  }, []);

  // Modals
  const handleOpenDirectModal = useCallback(() => {
    setIsNewDirectModalOpen(true);
  }, []);

  const handleCloseDirectModal = useCallback(() => {
    setIsNewDirectModalOpen(false);
  }, []);

  const handleOpenGroupModal = useCallback(() => {
    setIsNewGroupModalOpen(true);
  }, []);

  const handleCloseGroupModal = useCallback(() => {
    setIsNewGroupModalOpen(false);
  }, []);

  // Create Direct Conversation
  const handleCreateDirect = useCallback(
    async (targetUserId: string) => {
      try {
        const conversation = await createDirectMutation.mutateAsync({
          targetUserId,
        });
        toast.success(`Đã mở cuộc trò chuyện với ${conversation.title}`);
        setSelectedConversationId(conversation.id);
        setActiveView('detail');
        setIsNewDirectModalOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể khởi tạo cuộc hội thoại trực tiếp');
        }
      }
    },
    [createDirectMutation],
  );

  // Create Group Conversation với Idempotency Key
  const handleCreateGroup = useCallback(
    async (title: string, memberIds: string[], idempotencyKey?: string) => {
      try {
        const group = await createGroupMutation.mutateAsync({
          title,
          memberIds,
          idempotencyKey,
        });
        toast.success(`Đã tạo nhóm "${group.title}" thành công!`);
        setSelectedConversationId(group.id);
        setActiveView('detail');
        setIsNewGroupModalOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể khởi tạo cuộc hội thoại nhóm');
        }
        throw error;
      }
    },
    [createGroupMutation],
  );

  // Danh sách tin nhắn cho cuộc hội thoại đang chọn (Rỗng cho đến khi Messaging Core được triển khai)
  const activeMessages = useMemo<ChatMessageItem[]>(() => {
    return [];
  }, []);

  // Thay đổi văn bản ô nhập
  const handleComposerTextChange = useCallback((text: string) => {
    setComposerText(text);
  }, []);

  // Phím tắt bàn phím trên composer (Enter chặn gửi vì tính năng đang phát triển)
  const handleComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
      }
    },
    [],
  );

  // Group Management Handlers
  const handleOpenRenameGroupModal = useCallback(() => {
    setIsRenameGroupModalOpen(true);
  }, []);

  const handleCloseRenameGroupModal = useCallback(() => {
    setIsRenameGroupModalOpen(false);
  }, []);

  const handleUpdateGroupTitle = useCallback(
    async (title: string) => {
      if (!selectedConversationId) return;
      try {
        await updateGroupTitleMutation.mutateAsync({
          conversationId: selectedConversationId,
          title,
        });
        toast.success('Đã cập nhật tên nhóm thành công');
        setIsRenameGroupModalOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể cập nhật tên nhóm');
        }
        throw error;
      }
    },
    [selectedConversationId, updateGroupTitleMutation],
  );

  const handleOpenAddGroupMembersModal = useCallback(() => {
    setIsAddGroupMembersModalOpen(true);
  }, []);

  const handleCloseAddGroupMembersModal = useCallback(() => {
    setIsAddGroupMembersModalOpen(false);
  }, []);

  const handleAddGroupMembers = useCallback(
    async (memberIds: string[]) => {
      if (!selectedConversationId) return;
      try {
        await addGroupMembersMutation.mutateAsync({
          conversationId: selectedConversationId,
          memberIds,
        });
        toast.success(`Đã thêm ${memberIds.length} thành viên vào nhóm`);
        setIsAddGroupMembersModalOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể thêm thành viên vào nhóm');
        }
        throw error;
      }
    },
    [selectedConversationId, addGroupMembersMutation],
  );

  const handleOpenTransferOwnershipModal = useCallback(
    (targetUserId?: string) => {
      setTransferTargetUserId(targetUserId ?? null);
      setIsTransferOwnershipModalOpen(true);
    },
    [],
  );

  const handleCloseTransferOwnershipModal = useCallback(() => {
    setIsTransferOwnershipModalOpen(false);
    setTransferTargetUserId(null);
  }, []);

  const handleTransferOwnership = useCallback(
    async (newOwnerId: string) => {
      if (!selectedConversationId) return;
      try {
        await transferOwnershipMutation.mutateAsync({
          conversationId: selectedConversationId,
          newOwnerId,
        });
        toast.success('Đã chuyển quyền Trưởng nhóm thành công');
        setIsTransferOwnershipModalOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể chuyển quyền Trưởng nhóm');
        }
        throw error;
      }
    },
    [selectedConversationId, transferOwnershipMutation],
  );

  const handleOpenKickMemberModal = useCallback(
    (userId: string, userName: string) => {
      setConfirmModalState({
        isOpen: true,
        type: 'KICK',
        targetUserId: userId,
        targetUserName: userName,
      });
    },
    [],
  );

  const handleOpenMemberLeaveModal = useCallback(() => {
    setConfirmModalState({
      isOpen: true,
      type: 'LEAVE',
    });
  }, []);

  const handleOpenOwnerLeaveGroupModal = useCallback(() => {
    setIsOwnerLeaveGroupModalOpen(true);
  }, []);

  const handleCloseOwnerLeaveGroupModal = useCallback(() => {
    setIsOwnerLeaveGroupModalOpen(false);
  }, []);

  const handleOwnerLeaveGroup = useCallback(
    async (newOwnerId?: string) => {
      if (!selectedConversationId) return;
      try {
        await leaveGroupMutation.mutateAsync({
          conversationId: selectedConversationId,
          newOwnerId,
        });
        toast.success('Bạn đã rời khỏi nhóm thành công');
        setIsOwnerLeaveGroupModalOpen(false);
        setSelectedConversationId(null);
        setActiveView('list');
        setIsInfoPanelOpen(false);
      } catch (error: unknown) {
        if (isApiError(error)) {
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Không thể rời khỏi nhóm');
        }
        throw error;
      }
    },
    [selectedConversationId, leaveGroupMutation],
  );

  const handleOpenDissolveGroupModal = useCallback(() => {
    setConfirmModalState({
      isOpen: true,
      type: 'DISSOLVE',
    });
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmModalState({
      isOpen: false,
      type: null,
    });
  }, []);

  const handleExecuteConfirmAction = useCallback(async () => {
    if (!selectedConversationId) return;
    const { type, targetUserId } = confirmModalState;

    try {
      if (type === 'KICK' && targetUserId) {
        await removeMemberMutation.mutateAsync({
          conversationId: selectedConversationId,
          userId: targetUserId,
        });
        toast.success('Đã xóa thành viên khỏi nhóm');
        handleCloseConfirmModal();
      } else if (type === 'LEAVE') {
        await leaveGroupMutation.mutateAsync({
          conversationId: selectedConversationId,
        });
        toast.success('Bạn đã rời khỏi nhóm thành công');
        handleCloseConfirmModal();
        setSelectedConversationId(null);
        setActiveView('list');
        setIsInfoPanelOpen(false);
      } else if (type === 'DISSOLVE') {
        await dissolveGroupMutation.mutateAsync({
          conversationId: selectedConversationId,
        });
        toast.success('Đã giải tán nhóm thành công');
        handleCloseConfirmModal();
        setSelectedConversationId(null);
        setActiveView('list');
        setIsInfoPanelOpen(false);
      }
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Thao tác không thành công');
      }
      throw error;
    }
  }, [
    selectedConversationId,
    confirmModalState,
    removeMemberMutation,
    leaveGroupMutation,
    dissolveGroupMutation,
    handleCloseConfirmModal,
  ]);

  // Actions
  const handleOpenUserProfile = useCallback(
    (targetUserId: string) => {
      navigate(getClientProfilePath(targetUserId, currentUser?.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate, currentUser?.id],
  );

  const handleRetryConversations = useCallback(() => {
    void conversationsQuery.refetch();
  }, [conversationsQuery]);

  const handleRetryActiveConversation = useCallback(() => {
    void activeConversationQuery.refetch();
  }, [activeConversationQuery]);

  const handleRetryFriends = useCallback(() => {
    void friendsQuery.refetch();
  }, [friendsQuery]);

  return {
    // Current User
    currentUser,
    // Composer & Messages state
    composerText,
    activeMessages,
    handleComposerTextChange,
    handleComposerKeyDown,
    // State
    selectedConversationId,
    filterType,
    searchQuery,
    activeView,
    isInfoPanelOpen,
    isNewDirectModalOpen,
    isNewGroupModalOpen,
    // Group Management Modal States
    isRenameGroupModalOpen,
    isAddGroupMembersModalOpen,
    isTransferOwnershipModalOpen,
    transferTargetUserId,
    isOwnerLeaveGroupModalOpen,
    confirmModalState,
    // Data
    conversations,
    activeConversation: activeConversationQuery.data ?? null,
    friends,
    // Loading & error states
    isLoadingConversations: conversationsQuery.isLoading,
    isConversationsError: conversationsQuery.isError,
    isLoadingActiveConversation: activeConversationQuery.isLoading,
    isActiveConversationError: activeConversationQuery.isError,
    isLoadingFriends: friendsQuery.isLoading,
    isFriendsError: friendsQuery.isError,
    isCreatingDirect: createDirectMutation.isPending,
    isCreatingGroup: createGroupMutation.isPending,
    isUpdatingGroupTitle: updateGroupTitleMutation.isPending,
    isAddingGroupMembers: addGroupMembersMutation.isPending,
    isRemovingGroupMember: removeMemberMutation.isPending,
    isTransferringOwnership: transferOwnershipMutation.isPending,
    isLeavingGroup: leaveGroupMutation.isPending,
    isDissolvingGroup: dissolveGroupMutation.isPending,
    // Actions
    setFilterType,
    setSearchQuery,
    handleSelectConversation,
    handleBackToList,
    handleToggleInfoPanel,
    handleCloseInfoPanel,
    handleOpenDirectModal,
    handleCloseDirectModal,
    handleOpenGroupModal,
    handleCloseGroupModal,
    handleCreateDirect,
    handleCreateGroup,
    handleOpenUserProfile,
    handleRetryConversations,
    handleRetryActiveConversation,
    handleRetryFriends,
    // Group Management Actions
    handleOpenRenameGroupModal,
    handleCloseRenameGroupModal,
    handleUpdateGroupTitle,
    handleOpenAddGroupMembersModal,
    handleCloseAddGroupMembersModal,
    handleAddGroupMembers,
    handleOpenTransferOwnershipModal,
    handleCloseTransferOwnershipModal,
    handleTransferOwnership,
    handleOpenKickMemberModal,
    handleOpenMemberLeaveModal,
    handleOpenOwnerLeaveGroupModal,
    handleCloseOwnerLeaveGroupModal,
    handleOwnerLeaveGroup,
    handleOpenDissolveGroupModal,
    handleCloseConfirmModal,
    handleExecuteConfirmAction,
  };
}

export type MessagesController = ReturnType<typeof useMessagesController>;
