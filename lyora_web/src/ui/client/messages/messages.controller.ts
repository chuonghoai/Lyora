import { useCallback, useMemo, useState } from 'react';
import { isApiError, toast, useDebounce } from '@/core';
import {
  useConversationDetailQuery,
  useConversationFriendsQuery,
  useConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupConversationMutation,
  type ConversationSummary,
  type ConversationType,
} from '@/features/conversations';

export type MessagesFilterType = 'ALL' | ConversationType;
export type MessagesActiveView = 'list' | 'detail';

export function useMessagesController() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [filterType, setFilterType] = useState<MessagesFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<MessagesActiveView>('list');
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);

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

  // Mutations
  const createDirectMutation = useCreateDirectConversationMutation();
  const createGroupMutation = useCreateGroupConversationMutation();

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
        throw error;
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

  return {
    // State
    selectedConversationId,
    filterType,
    searchQuery,
    activeView,
    isInfoPanelOpen,
    isNewDirectModalOpen,
    isNewGroupModalOpen,
    // Data
    conversations,
    activeConversation: activeConversationQuery.data ?? null,
    friends,
    // Loading states
    isLoadingConversations: conversationsQuery.isLoading,
    isLoadingActiveConversation: activeConversationQuery.isLoading,
    isLoadingFriends: friendsQuery.isLoading,
    isCreatingDirect: createDirectMutation.isPending,
    isCreatingGroup: createGroupMutation.isPending,
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
  };
}

export type MessagesController = ReturnType<typeof useMessagesController>;
