import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  isApiError,
  toast,
  useAuthStore,
} from '@/core';
import {
  type PostsFeedFilter,
  type PostVisibility,
  type ReactionType,
} from '@/features/posts';
import { useAcceptedFriendsQuery } from '@/features/friends';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/features/user';
import { getClientProfilePath } from '@/routes/paths';
import {
  MAX_AUDIO_RECORDING_SECONDS,
  usePostFeedController,
  type ComposerTaggedUser,
  type FriendContactItem,
  type MediaLightboxState,
  type ReactionsPopoverState,
} from './post-feed.controller';

export type VisibilityFilterOption = 'ALL' | PostVisibility;
export type {
  ComposerTaggedUser,
  FriendContactItem,
  MediaLightboxState,
  ReactionsPopoverState,
};
export { MAX_AUDIO_RECORDING_SECONDS };

export interface ChatReplySnapshot {
  id: string;
  senderName: string;
  text: string;
}

export type ChatMessageKind = 'TEXT' | 'LIKE';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isMine: boolean;
  kind?: ChatMessageKind;
  reaction?: ReactionType | null;
  isRecalled?: boolean;
  replyTo?: ChatReplySnapshot | null;
  forwardedFrom?: string | null;
  mediaUrl?: string | null;
}

export type ChatPickerTab = 'none' | 'emoji' | 'sticker' | 'gif';

export interface ChatWindowSession {
  friendId: string;
  isMinimized: boolean;
  draft: string;
  replyingTo: ChatMessageItem | null;
  isPlusMenuOpen: boolean;
  pickerTab: ChatPickerTab;
}

export interface ProfileEditFormState {
  fullName: string;
  phoneNumber: string;
  bio: string;
  location: string;
}

export const MAX_EXPANDED_CHAT_WINDOWS = 3;
export const MAX_TOTAL_CHAT_WINDOWS = 5;
export const MAX_OPEN_CHAT_WINDOWS = MAX_EXPANDED_CHAT_WINDOWS;

function enforceChatWindowLimits(
  windows: ChatWindowSession[],
  priorityFriendId?: string,
): ChatWindowSession[] {
  const next = [...windows];

  while (next.length > MAX_TOTAL_CHAT_WINDOWS) {
    const oldestMinimizedIdx = next.findIndex(
      (w) => w.isMinimized && w.friendId !== priorityFriendId,
    );
    if (oldestMinimizedIdx !== -1) {
      next.splice(oldestMinimizedIdx, 1);
    } else {
      const oldestOtherIdx = next.findIndex((w) => w.friendId !== priorityFriendId);
      next.splice(oldestOtherIdx !== -1 ? oldestOtherIdx : 0, 1);
    }
  }

  let expandedCount = next.filter((w) => !w.isMinimized).length;
  while (expandedCount > MAX_EXPANDED_CHAT_WINDOWS) {
    const collapseIdx = next.findIndex(
      (w) => !w.isMinimized && w.friendId !== priorityFriendId,
    );
    if (collapseIdx === -1) break;
    next[collapseIdx] = {
      ...next[collapseIdx],
      isMinimized: true,
      isPlusMenuOpen: false,
      pickerTab: 'none',
    };
    expandedCount--;
  }

  return next;
}

export function useHomeController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const searchQuery = '';
  const debouncedSearch = '';

  const tabParam = searchParams.get('tab');
  const activeTab: PostsFeedFilter = tabParam === 'saved' ? 'saved' : 'all';

  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterOption>('ALL');

  const friendsQuery = useAcceptedFriendsQuery();
  const userProfileQuery = useUserProfileQuery({
    enabled: Boolean(currentUser),
    retry: false,
  });
  const updateProfileMutation = useUpdateUserProfileMutation();

  const profileUser = userProfileQuery.data ?? currentUser;

  // Personal Profile Inline Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileEditFormState>({
    fullName: currentUser?.fullName ?? '',
    phoneNumber: currentUser?.phoneNumber ?? '',
    bio: currentUser?.bio ?? '',
    location: currentUser?.location ?? '',
  });
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  // All Friends Modal State
  const [isAllFriendsModalOpen, setIsAllFriendsModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Multi-Window Friend Chat Widget State (3 mở hẳn + 2 avatar rút gọn = tối đa 5)
  const [openChatWindows, setOpenChatWindows] = useState<ChatWindowSession[]>([]);
  const [chatMessagesByFriend, setChatMessagesByFriend] = useState<
    Record<string, ChatMessageItem[]>
  >({});
  const [pinnedMessageByFriend, setPinnedMessageByFriend] = useState<
    Record<string, ChatMessageItem | null>
  >({});
  const [forwardingState, setForwardingState] = useState<{
    sourceFriendId: string;
    message: ChatMessageItem;
  } | null>(null);

  const friends = useMemo<FriendContactItem[]>(() => {
    const rawFriends = friendsQuery.data ?? [];
    return rawFriends.map((friend) => ({
      id: friend.id,
      fullName: friend.fullName,
      avatarUrl: friend.avatarUrl,
      isOnline: friend.isOnline ?? false,
    }));
  }, [friendsQuery.data]);

  const filteredFriends = useMemo<FriendContactItem[]>(() => {
    const normalized = friendSearchQuery.trim().toLowerCase();
    if (!normalized) return friends;
    return friends.filter((friend) =>
      friend.fullName.toLowerCase().includes(normalized),
    );
  }, [friends, friendSearchQuery]);

  const getDefaultMessagesForFriend = useCallback(
    (friend: FriendContactItem): ChatMessageItem[] => {
      const greetingByFriend: Record<string, { incoming: string; outgoing: string }> = {
        'preview-user-1': {
          incoming: `Chào ${currentUser?.fullName?.split(' ').pop() || 'bạn'}! Sáng nay trên Đà Lạt trời mát lắm nè.`,
          outgoing: 'Ảnh đồi thông bạn chụp đẹp quá luôn!',
        },
        'preview-user-2': {
          incoming: 'Bạn xem qua bài tổng hợp góc làm việc tối giản mình mới đăng chưa?',
          outgoing: 'Rồi nè, góc số 1 ánh sáng nhìn dịu mắt lắm!',
        },
        'preview-user-3': {
          incoming: 'Cuối tuần này nhóm có buổi meetup cộng đồng, bạn tham gia nhé?',
          outgoing: 'Ok luôn, cho mình đăng ký một slot nha!',
        },
        'preview-user-4': {
          incoming: 'Sáng mai 6h chạy bộ cùng nhóm không bạn ơi?',
          outgoing: 'Sáng mai mình dậy sớm chạy 5km cùng mọi người nhé!',
        },
        'preview-user-5': {
          incoming: 'Chiều nay rảnh đi làm ly trà đào ngắm hoàng hôn không?',
          outgoing: 'Triển luôn bạn ơi, tầm 5h30 nhé!',
        },
      };

      const sample = greetingByFriend[friend.id] ?? {
        incoming: `Chào ${currentUser?.fullName?.split(' ').pop() || 'bạn'}! Hôm nay của bạn thế nào?`,
        outgoing: 'Mình vừa xem bài viết mới của bạn trên Lyora nè!',
      };

      return [
        {
          id: `welcome-${friend.id}-1`,
          senderId: friend.id,
          senderName: friend.fullName,
          text: sample.incoming,
          createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          isMine: false,
        },
        {
          id: `welcome-${friend.id}-2`,
          senderId: currentUser?.id || 'me',
          senderName: currentUser?.fullName || 'Bạn',
          text: sample.outgoing,
          createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          isMine: true,
          reaction: 'LOVE',
        },
      ];
    },
    [currentUser],
  );

  const getFriendById = useCallback(
    (friendId: string): FriendContactItem | null =>
      friends.find((f) => f.id === friendId) ?? null,
    [friends],
  );

  const getMessagesForFriend = useCallback(
    (friendId: string): ChatMessageItem[] => {
      const friend = friends.find((f) => f.id === friendId);
      if (!friend) return [];
      const existing = chatMessagesByFriend[friendId];
      if (existing && existing.length > 0) {
        return existing;
      }
      return getDefaultMessagesForFriend(friend);
    },
    [friends, chatMessagesByFriend, getDefaultMessagesForFriend],
  );

  const getPinnedMessageForFriend = useCallback(
    (friendId: string): ChatMessageItem | null =>
      pinnedMessageByFriend[friendId] ?? null,
    [pinnedMessageByFriend],
  );

  const handleOpenChatWithFriend = (friendId: string) => {
    setOpenChatWindows((prev) => {
      const existing = prev.find((win) => win.friendId === friendId);
      if (existing) {
        const updated = prev.map((win) =>
          win.friendId === friendId ? { ...win, isMinimized: false } : win,
        );
        return enforceChatWindowLimits(updated, friendId);
      }

      const nextWindow: ChatWindowSession = {
        friendId,
        isMinimized: false,
        draft: '',
        replyingTo: null,
        isPlusMenuOpen: false,
        pickerTab: 'none',
      };

      return enforceChatWindowLimits([...prev, nextWindow], friendId);
    });
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setIsAllFriendsModalOpen(false);
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const postFeed = usePostFeedController({
    limit: 5,
    search: debouncedSearch,
    filter: activeTab,
    visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
    friends,
    profileUser,
    hasBlockingExternalModal: isAllFriendsModalOpen,
    onOpenUserProfile: handleOpenUserProfile,
    onOpenChatWithFriend: handleOpenChatWithFriend,
  });

  useEffect(() => {
    if (!isAllFriendsModalOpen || postFeed.lightbox || postFeed.reactionsPopover) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAllFriendsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAllFriendsModalOpen, postFeed.lightbox, postFeed.reactionsPopover]);

  const handleSelectTab = (tab: PostsFeedFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'all') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleSelectVisibilityFilter = (filter: VisibilityFilterOption) => {
    setVisibilityFilter(filter);
  };

  const handleClearFilters = () => {
    setVisibilityFilter('ALL');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Personal Profile Inline Edit Handlers
  const handleStartEditProfile = () => {
    setProfileForm({
      fullName: profileUser?.fullName ?? '',
      phoneNumber: profileUser?.phoneNumber ?? '',
      bio: profileUser?.bio ?? '',
      location: profileUser?.location ?? '',
    });
    setProfileFormError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileFormError(null);
  };

  const handleProfileFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileFormError) setProfileFormError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = profileForm.fullName.trim();
    const trimmedPhone = profileForm.phoneNumber.trim();
    const trimmedBio = profileForm.bio.trim();
    const trimmedLocation = profileForm.location.trim();

    if (trimmedName.length < 2) {
      setProfileFormError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }

    if (trimmedPhone && !/^[0-9+\-\s().]{8,20}$/.test(trimmedPhone)) {
      setProfileFormError('Số điện thoại không đúng định dạng (8–20 ký tự).');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: trimmedName,
        phoneNumber: trimmedPhone || null,
        bio: trimmedBio || null,
        location: trimmedLocation || null,
      });
      setIsEditingProfile(false);
      setProfileFormError(null);
      toast.success('Đã cập nhật thông tin cá nhân.');
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : 'Không thể cập nhật thông tin cá nhân lúc này.';
      setProfileFormError(message);
    }
  };

  // All Friends Modal Handlers
  const handleOpenAllFriendsModal = () => {
    setFriendSearchQuery('');
    setIsAllFriendsModalOpen(true);
  };

  const handleCloseAllFriendsModal = () => {
    setIsAllFriendsModalOpen(false);
  };

  const handleFriendSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendSearchQuery(e.target.value);
  };

  // Multi-Window Friend Chat Box Handlers
  const updateChatWindow = (
    friendId: string,
    updater: (win: ChatWindowSession) => ChatWindowSession,
  ) => {
    setOpenChatWindows((prev) =>
      prev.map((win) => (win.friendId === friendId ? updater(win) : win)),
    );
  };

  const ensureFriendConversation = (friend: FriendContactItem): ChatMessageItem[] => {
    return chatMessagesByFriend[friend.id] ?? getDefaultMessagesForFriend(friend);
  };

  const handleMinimizeChatWindow = (friendId: string) => {
    setOpenChatWindows((prev) => {
      const target = prev.find((w) => w.friendId === friendId);
      if (!target) return prev;
      const willExpand = target.isMinimized;
      const updated = prev.map((win) =>
        win.friendId === friendId
          ? {
              ...win,
              isMinimized: !win.isMinimized,
              isPlusMenuOpen: false,
              pickerTab: 'none' as ChatPickerTab,
            }
          : win,
      );
      return willExpand
        ? enforceChatWindowLimits(updated, friendId)
        : updated;
    });
  };

  const handleCloseChatWindow = (friendId: string) => {
    setOpenChatWindows((prev) => prev.filter((win) => win.friendId !== friendId));
    if (forwardingState?.sourceFriendId === friendId) {
      setForwardingState(null);
    }
  };

  const handleChatDraftChange = (
    friendId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    updateChatWindow(friendId, (win) => ({
      ...win,
      draft: val,
      isPlusMenuOpen: val.trim() ? win.isPlusMenuOpen : false,
    }));
  };

  const appendOutgoingChatMessage = (
    friendId: string,
    text: string,
    mediaUrl?: string | null,
    kind: ChatMessageKind = 'TEXT',
  ) => {
    const friend = getFriendById(friendId);
    if (!friend) return;

    const currentWindow = openChatWindows.find((win) => win.friendId === friendId);
    const baseMessages = ensureFriendConversation(friend);
    const replySnapshot = currentWindow?.replyingTo
      ? {
          id: currentWindow.replyingTo.id,
          senderName: currentWindow.replyingTo.isMine
            ? 'Bạn'
            : currentWindow.replyingTo.senderName,
          text: currentWindow.replyingTo.isRecalled
            ? 'Tin nhắn đã được thu hồi'
            : currentWindow.replyingTo.text,
        }
      : null;

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.fullName || 'Bạn',
      text,
      kind,
      createdAt: new Date().toISOString(),
      isMine: true,
      replyTo: replySnapshot,
      mediaUrl: mediaUrl ?? null,
    };

    setChatMessagesByFriend((prev) => ({
      ...prev,
      [friendId]: [...baseMessages, newMsg],
    }));

    updateChatWindow(friendId, (win) => ({
      ...win,
      replyingTo: null,
      isPlusMenuOpen: false,
      pickerTab: 'none',
    }));
  };

  const handleSendChatMessage = (friendId: string, e: React.FormEvent) => {
    e.preventDefault();
    const targetWin = openChatWindows.find((win) => win.friendId === friendId);
    const trimmed = targetWin?.draft.trim() ?? '';
    if (!trimmed) return;

    appendOutgoingChatMessage(friendId, trimmed);
    updateChatWindow(friendId, (win) => ({ ...win, draft: '' }));
  };

  const handleSendQuickLike = (friendId: string) => {
    appendOutgoingChatMessage(friendId, 'Đã gửi lượt thích', null, 'LIKE');
  };

  const handleReplyMessage = (friendId: string, msg: ChatMessageItem) => {
    updateChatWindow(friendId, (win) => ({ ...win, replyingTo: msg }));
    const input = document.getElementById(`lyora-mini-chat-input-${friendId}`);
    input?.focus();
  };

  const handleCancelReply = (friendId: string) => {
    updateChatWindow(friendId, (win) => ({ ...win, replyingTo: null }));
  };

  const handleRecallMessage = (friendId: string, msgId: string) => {
    const friend = getFriendById(friendId);
    if (!friend) return;
    const baseMessages = ensureFriendConversation(friend);
    setChatMessagesByFriend((prev) => ({
      ...prev,
      [friendId]: baseMessages.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isRecalled: true,
              text: 'Tin nhắn đã được thu hồi',
              reaction: null,
              mediaUrl: null,
            }
          : m,
      ),
    }));
    if (pinnedMessageByFriend[friendId]?.id === msgId) {
      setPinnedMessageByFriend((prev) => ({ ...prev, [friendId]: null }));
    }
    toast.info('Đã thu hồi tin nhắn.');
  };

  const handleTogglePinMessage = (friendId: string, msg: ChatMessageItem) => {
    const currentPinned = pinnedMessageByFriend[friendId];
    if (currentPinned?.id === msg.id) {
      setPinnedMessageByFriend((prev) => ({ ...prev, [friendId]: null }));
      toast.info('Đã bỏ ghim tin nhắn.');
    } else {
      setPinnedMessageByFriend((prev) => ({ ...prev, [friendId]: msg }));
      toast.success('Đã ghim tin nhắn lên đầu cuộc trò chuyện.');
    }
  };

  const handleUnpinCurrentMessage = (friendId: string) => {
    setPinnedMessageByFriend((prev) => ({ ...prev, [friendId]: null }));
  };

  const handleOpenForwardMessage = (sourceFriendId: string, msg: ChatMessageItem) => {
    setForwardingState({ sourceFriendId, message: msg });
  };

  const handleCancelForward = () => {
    setForwardingState(null);
  };

  const handleConfirmForwardToFriend = (targetFriendId: string) => {
    if (!forwardingState) return;
    const targetFriend = getFriendById(targetFriendId);
    if (!targetFriend) return;

    const existingTargetMsgs = ensureFriendConversation(targetFriend);
    const forwardedMsg: ChatMessageItem = {
      id: `fwd-${Date.now()}`,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.fullName || 'Bạn',
      text: forwardingState.message.text,
      kind: forwardingState.message.kind,
      createdAt: new Date().toISOString(),
      isMine: true,
      forwardedFrom: forwardingState.message.senderName,
      mediaUrl: forwardingState.message.mediaUrl,
    };

    setChatMessagesByFriend((prev) => ({
      ...prev,
      [targetFriendId]: [...existingTargetMsgs, forwardedMsg],
    }));
    setForwardingState(null);
    toast.success(`Đã chuyển tiếp tin nhắn tới ${targetFriend.fullName}.`);
  };

  const handleReactChatMessage = (friendId: string, msgId: string, reactionType: ReactionType) => {
    const friend = getFriendById(friendId);
    if (!friend) return;
    const baseMessages = ensureFriendConversation(friend);
    setChatMessagesByFriend((prev) => ({
      ...prev,
      [friendId]: baseMessages.map((m) =>
        m.id === msgId
          ? { ...m, reaction: m.reaction === reactionType ? null : reactionType }
          : m,
      ),
    }));
  };

  const handleToggleChatPlusMenu = (friendId: string) => {
    updateChatWindow(friendId, (win) => ({
      ...win,
      pickerTab: 'none',
      isPlusMenuOpen: !win.isPlusMenuOpen,
    }));
  };

  const handleToggleChatPicker = (friendId: string, tab: ChatPickerTab) => {
    updateChatWindow(friendId, (win) => ({
      ...win,
      isPlusMenuOpen: false,
      pickerTab: win.pickerTab === tab ? 'none' : tab,
    }));
  };

  const handleInsertEmoji = (friendId: string, emoji: string) => {
    updateChatWindow(friendId, (win) => ({
      ...win,
      draft: `${win.draft}${emoji}`,
    }));
    const input = document.getElementById(`lyora-mini-chat-input-${friendId}`);
    input?.focus();
  };

  const handleSendStickerOrGif = (friendId: string, contentText: string) => {
    appendOutgoingChatMessage(friendId, contentText);
  };

  const handlePickChatImage = (
    friendId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    appendOutgoingChatMessage(friendId, file.name, url);
    e.target.value = '';
  };

  const handleVoiceOrCallAction = (kind: 'mic' | 'audio-call' | 'video-call') => {
    const labelMap = {
      mic: 'Ghi âm tin nhắn thoại sẽ hoạt động khi kết nối dịch vụ Media.',
      'audio-call': 'Cuộc gọi thoại thời gian thực sẽ khả dụng khi kết nối WebSocket/WebRTC.',
      'video-call': 'Cuộc gọi video thời gian thực sẽ khả dụng khi kết nối WebSocket/WebRTC.',
    };
    toast.info(labelMap[kind]);
    setOpenChatWindows((prev) => prev.map((win) => ({ ...win, isPlusMenuOpen: false })));
  };

  return {
    appTitle,
    ...postFeed,
    profileUser,
    isEditingProfile,
    profileForm,
    profileFormError,
    isUpdatingProfile: updateProfileMutation.isPending,
    filteredFriends,
    friendSearchQuery,
    isAllFriendsModalOpen,
    activeTab,
    visibilityFilter,
    searchQuery,
    debouncedSearch,

    // Multi-Window Mini Chat Widget States
    maxExpandedChatWindows: MAX_EXPANDED_CHAT_WINDOWS,
    maxTotalChatWindows: MAX_TOTAL_CHAT_WINDOWS,
    maxChatWindows: MAX_EXPANDED_CHAT_WINDOWS,
    openChatWindows,
    forwardingState,
    getFriendById,
    getMessagesForFriend,
    getPinnedMessageForFriend,

    // Home Specific Handlers
    handleSelectTab,
    handleSelectVisibilityFilter,
    handleClearFilters,
    handleStartEditProfile,
    handleCancelEditProfile,
    handleProfileFormChange,
    handleSaveProfile,
    handleOpenAllFriendsModal,
    handleCloseAllFriendsModal,
    handleFriendSearchChange,
    handleOpenUserProfile,
    handleMinimizeChatWindow,
    handleCloseChatWindow,
    handleChatDraftChange,
    handleSendChatMessage,
    handleSendQuickLike,
    handleReplyMessage,
    handleCancelReply,
    handleRecallMessage,
    handleTogglePinMessage,
    handleUnpinCurrentMessage,
    handleOpenForwardMessage,
    handleCancelForward,
    handleConfirmForwardToFriend,
    handleReactChatMessage,
    handleToggleChatPlusMenu,
    handleToggleChatPicker,
    handleInsertEmoji,
    handleSendStickerOrGif,
    handlePickChatImage,
    handleVoiceOrCallAction,
  };
}

export { useHomeController as useClientHomeController };
export type HomeController = ReturnType<typeof useHomeController>;
