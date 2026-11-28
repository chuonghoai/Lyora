import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  isApiError,
  toast,
  useAuthStore,
} from '@/core';
import { useCreateDirectConversationMutation } from '@/features/conversations';
import {
  useCreatePostAppealMutation,
  type Post,
  type PostsFeedFilter,
  type PostVisibility,
} from '@/features/posts';
import { useAcceptedFriendsQuery } from '@/features/friends';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/features/user';
import { getClientProfilePath, ROUTES } from '@/routes/paths';
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

export interface ProfileEditFormState {
  fullName: string;
  phoneNumber: string;
  bio: string;
  location: string;
}

export function useHomeController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const activeTab: PostsFeedFilter = 'all';
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterOption>('ALL');

  const friendsQuery = useAcceptedFriendsQuery();
  const createDirectConversationMutation = useCreateDirectConversationMutation();
  const createPostAppealMutation = useCreatePostAppealMutation();
  const userProfileQuery = useUserProfileQuery({
    enabled: Boolean(currentUser),
    retry: false,
  });
  const updateProfileMutation = useUpdateUserProfileMutation();

  const profileUser = userProfileQuery.data ?? currentUser;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileEditFormState>({
    fullName: currentUser?.fullName ?? '',
    phoneNumber: currentUser?.phoneNumber ?? '',
    bio: currentUser?.bio ?? '',
    location: currentUser?.location ?? '',
  });
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  const [isAllFriendsModalOpen, setIsAllFriendsModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [appealTargetPost, setAppealTargetPost] = useState<Post | null>(null);

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

  const handleOpenChatWithFriend = async (friendId: string) => {
    try {
      const conversation = await createDirectConversationMutation.mutateAsync({
        targetUserId: friendId,
      });
      navigate(`${ROUTES.CLIENT.MESSAGES}?conversationId=${encodeURIComponent(conversation.id)}`);
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : 'Không thể mở cuộc trò chuyện lúc này.';
      toast.error(message);
    }
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setIsAllFriendsModalOpen(false);
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFriendsPage = () => {
    setIsAllFriendsModalOpen(false);
    navigate(ROUTES.CLIENT.FRIENDS);
  };

  const postFeed = usePostFeedController({
    limit: 5,
    filter: activeTab,
    visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
    friends,
    profileUser,
    hasBlockingExternalModal: isAllFriendsModalOpen || Boolean(appealTargetPost),
    onOpenUserProfile: handleOpenUserProfile,
    onOpenChatWithFriend: (friendId) => {
      void handleOpenChatWithFriend(friendId);
    },
  });

  const shouldOpenComposerFromQuery = searchParams.get('compose') === '1';
  const expandComposer = postFeed.handleExpandComposer;
  useEffect(() => {
    if (!shouldOpenComposerFromQuery) return;
    expandComposer();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('compose');
        return next;
      },
      { replace: true },
    );
    window.setTimeout(() => {
      document.getElementById('lyora-post-composer-input')?.focus();
    }, 0);
  }, [shouldOpenComposerFromQuery, expandComposer, setSearchParams]);

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

  const handleSelectVisibilityFilter = (filter: VisibilityFilterOption) => {
    setVisibilityFilter(filter);
  };

  const handleClearFilters = () => {
    setVisibilityFilter('ALL');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

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

  const handleOpenAllFriendsModal = () => {
    navigate(ROUTES.CLIENT.FRIENDS);
  };

  const handleCloseAllFriendsModal = () => {
    setIsAllFriendsModalOpen(false);
  };

  const handleFriendSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendSearchQuery(e.target.value);
  };

  const handleClearFriendSearch = () => {
    setFriendSearchQuery('');
  };

  const handleRetryFriends = () => {
    void friendsQuery.refetch();
  };

  const handleOpenAppealModal = (post: Post) => {
    setAppealTargetPost(post);
  };

  const handleCloseAppealModal = () => {
    if (createPostAppealMutation.isPending) return;
    setAppealTargetPost(null);
  };

  const handleSubmitPostAppeal = async (payload: {
    reasonCategory: string;
    reasonDetail: string;
  }) => {
    if (!appealTargetPost) return;
    try {
      await createPostAppealMutation.mutateAsync({
        postId: appealTargetPost.id,
        reasonCategory: payload.reasonCategory,
        reasonDetail: payload.reasonDetail,
      });
      setAppealTargetPost(null);
      toast.success('Đã gửi khiếu nại bài viết tới Ban Quản Trị để xem xét.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể gửi khiếu nại bài viết lúc này.',
      );
    }
  };

  return {
    appTitle,
    ...postFeed,
    profileUser,
    isEditingProfile,
    profileForm,
    profileFormError,
    isUpdatingProfile: updateProfileMutation.isPending,
    isFriendsLoading: friendsQuery.isLoading,
    isFriendsError: friendsQuery.isError,
    isCreatingDirectChat: createDirectConversationMutation.isPending,
    appealTargetPost,
    isSubmittingAppeal: createPostAppealMutation.isPending,
    filteredFriends,
    friendSearchQuery,
    isAllFriendsModalOpen,
    activeTab,
    visibilityFilter,
    handleSelectVisibilityFilter,
    handleClearFilters,
    handleStartEditProfile,
    handleCancelEditProfile,
    handleProfileFormChange,
    handleSaveProfile,
    handleOpenAllFriendsModal,
    handleCloseAllFriendsModal,
    handleFriendSearchChange,
    handleClearFriendSearch,
    handleRetryFriends,
    handleOpenFriendsPage,
    handleOpenUserProfile,
    handleOpenChatWithFriend,
    handleOpenAppealModal,
    handleCloseAppealModal,
    handleSubmitPostAppeal,
  };
}

export { useHomeController as useClientHomeController };
export type HomeController = ReturnType<typeof useHomeController>;
