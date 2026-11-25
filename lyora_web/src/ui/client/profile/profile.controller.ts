import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore, useClickOutside } from '@/core';
import {
  PROFILE_COVER_PRESETS,
  updateExtendedProfileSchema,
  useAcceptFriendRequestMutation,
  useCancelFriendRequestMutation,
  useProfileActivityQuery,
  useProfileFriendsDirectoryQuery,
  useProfilePageQuery,
  useRejectFriendRequestMutation,
  useSendFriendRequestMutation,
  useUnfriendMutation,
  useUpdateExtendedProfileMutation,
  type ProfileActivityItem,
  type ProfileActivityTabKey,
  type ProfileFriendsFilter,
  type ProfileFriendSummary,
  type ProfileTabKey,
  type PublicUserProfile,
} from '@/features/user';
import { getClientProfilePath, ROUTES } from '@/routes/paths';

export interface ProfileEditModalFormState {
  fullName: string;
  phoneNumber: string;
  bio: string;
  location: string;
  hometown: string;
  workplace: string;
  education: string;
  website: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}

export interface UnfriendTargetState {
  id: string;
  fullName: string;
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc dữ liệu ảnh.'));
      }
    };
    reader.onerror = () => reject(new Error('Không thể tải tệp ảnh từ thiết bị.'));
    reader.readAsDataURL(file);
  });
}

function buildEditFormState(profile?: PublicUserProfile | null): ProfileEditModalFormState {
  return {
    fullName: profile?.fullName ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    hometown: profile?.hometown ?? '',
    workplace: profile?.workplace ?? '',
    education: profile?.education ?? '',
    website: profile?.website ?? '',
    avatarUrl: profile?.avatarUrl ?? null,
    coverUrl: profile?.coverUrl ?? PROFILE_COVER_PRESETS[0].url,
  };
}

export function useProfileController() {
  const { userId } = useParams<{ userId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const profileQuery = useProfilePageQuery(userId);
  const directoryQuery = useProfileFriendsDirectoryQuery();
  const activityQuery = useProfileActivityQuery(userId);

  const updateProfileMutation = useUpdateExtendedProfileMutation();
  const sendRequestMutation = useSendFriendRequestMutation();
  const cancelRequestMutation = useCancelFriendRequestMutation();
  const acceptRequestMutation = useAcceptFriendRequestMutation();
  const rejectRequestMutation = useRejectFriendRequestMutation();
  const unfriendMutation = useUnfriendMutation();

  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTabKey =
    tabParam === 'about' || tabParam === 'friends' ? tabParam : 'overview';

  const [friendsFilter, setFriendsFilter] = useState<ProfileFriendsFilter>('ALL');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditModalFormState>(() =>
    buildEditFormState(profileQuery.data),
  );
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
  const [unfriendTarget, setUnfriendTarget] = useState<UnfriendTargetState | null>(null);

  const friendMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(friendMenuRef, () => setIsFriendMenuOpen(false));

  const profile = profileQuery.data ?? null;
  const isOwnProfile = Boolean(
    profile
      ? profile.friendshipStatus === 'SELF'
      : !userId || userId === 'me' || (currentUser?.id && userId === currentUser.id),
  );

  const [activityTab, setActivityTab] = useState<ProfileActivityTabKey>(() =>
    isOwnProfile ? 'tagged' : 'authored',
  );

  // Reset bộ lọc & modal khi chuyển giữa các hồ sơ khác nhau
  useEffect(() => {
    setFriendsFilter('ALL');
    setFriendSearchQuery('');
    setIsEditModalOpen(false);
    setIsFriendMenuOpen(false);
    setUnfriendTarget(null);
  }, [userId]);

  useEffect(() => {
    setActivityTab(isOwnProfile ? 'tagged' : 'authored');
  }, [userId, isOwnProfile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (unfriendTarget) {
        setUnfriendTarget(null);
      } else if (isEditModalOpen) {
        setIsEditModalOpen(false);
      } else if (isFriendMenuOpen) {
        setIsFriendMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unfriendTarget, isEditModalOpen, isFriendMenuOpen]);

  const directory = directoryQuery.data ?? {
    friends: [],
    incomingRequests: [],
    sentRequests: [],
    suggestions: [],
  };

  const overviewFriends = useMemo<ProfileFriendSummary[]>(() => {
    const list = isOwnProfile ? directory.friends : (profile?.friendsPreview ?? []);
    return list.slice(0, 6);
  }, [isOwnProfile, directory.friends, profile?.friendsPreview]);

  const friendsTabCounts = useMemo(() => {
    if (isOwnProfile) {
      return {
        all: directory.friends.length,
        mutual: 0,
        requests: directory.incomingRequests.length + directory.sentRequests.length,
        incomingRequests: directory.incomingRequests.length,
        sentRequests: directory.sentRequests.length,
        suggestions: directory.suggestions.length,
      };
    }

    const otherFriends = profile?.friendsPreview ?? [];
    const mutualList = otherFriends.filter((item) => item.mutualFriendsCount > 0);
    return {
      all: otherFriends.length,
      mutual: mutualList.length,
      requests: 0,
      incomingRequests: 0,
      sentRequests: 0,
      suggestions: 0,
    };
  }, [isOwnProfile, directory, profile?.friendsPreview]);

  const filteredFriendsList = useMemo<ProfileFriendSummary[]>(() => {
    let source: ProfileFriendSummary[] = [];

    if (isOwnProfile) {
      if (friendsFilter === 'REQUESTS') {
        source = [...directory.incomingRequests, ...directory.sentRequests];
      } else if (friendsFilter === 'SUGGESTIONS') {
        source = directory.suggestions;
      } else {
        source = directory.friends;
      }
    } else {
      const otherFriends = profile?.friendsPreview ?? [];
      source =
        friendsFilter === 'MUTUAL'
          ? otherFriends.filter((item) => item.mutualFriendsCount > 0)
          : otherFriends;
    }

    const keyword = friendSearchQuery.trim().toLowerCase();
    if (!keyword) return source;
    return source.filter((item) => {
      const matchName = item.fullName.toLowerCase().includes(keyword);
      const matchLocation = item.location?.toLowerCase().includes(keyword) ?? false;
      const matchHeadline = item.headline?.toLowerCase().includes(keyword) ?? false;
      return matchName || matchLocation || matchHeadline;
    });
  }, [isOwnProfile, friendsFilter, directory, profile?.friendsPreview, friendSearchQuery]);

  const isFriendshipMutating =
    sendRequestMutation.isPending ||
    cancelRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    rejectRequestMutation.isPending ||
    unfriendMutation.isPending;

  const handleSelectTab = (tab: ProfileTabKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleSelectFriendsFilter = (filter: ProfileFriendsFilter) => {
    setFriendsFilter(filter);
  };

  const handleFriendSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendSearchQuery(e.target.value);
  };

  const handleClearFriendSearch = () => {
    setFriendSearchQuery('');
  };

  const handleNavigateBackToFeed = () => {
    navigate(ROUTES.CLIENT.ROOT);
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setIsFriendMenuOpen(false);
    navigate(getClientProfilePath(targetUserId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMessages = () => {
    setIsFriendMenuOpen(false);
    navigate(ROUTES.CLIENT.MESSAGES);
  };

  const handleCopyProfileLink = async () => {
    if (!profile) return;
    const path = isOwnProfile ? ROUTES.CLIENT.PROFILE : getClientProfilePath(profile.id);
    const shareUrl = `${window.location.origin}${path}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Đã sao chép liên kết trang cá nhân.');
    } catch {
      toast.info('Không thể truy cập bộ nhớ tạm trên trình duyệt.');
    }
  };

  const handleOpenEditModal = () => {
    setEditForm(buildEditFormState(profile));
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (updateProfileMutation.isPending) return;
    setIsEditModalOpen(false);
    setEditErrors({});
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name] || editErrors._form) {
      setEditErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        delete next._form;
        return next;
      });
    }
  };

  const handleSelectCoverPreset = (url: string) => {
    setEditForm((prev) => ({ ...prev, coverUrl: url }));
  };

  const handlePickAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ cho ảnh đại diện.');
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.warning('Ảnh đại diện có dung lượng tối đa 5MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chọn ảnh đại diện.');
    }
  };

  const handlePickCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ cho ảnh bìa.');
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.warning('Ảnh bìa có dung lượng tối đa 5MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditForm((prev) => ({ ...prev, coverUrl: dataUrl }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chọn ảnh bìa.');
    }
  };

  const handleRemoveAvatar = () => {
    setEditForm((prev) => ({ ...prev, avatarUrl: null }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = updateExtendedProfileSchema.safeParse({
      fullName: editForm.fullName,
      phoneNumber: editForm.phoneNumber,
      bio: editForm.bio,
      location: editForm.location,
      hometown: editForm.hometown,
      workplace: editForm.workplace,
      education: editForm.education,
      website: editForm.website,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '_form');
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setEditErrors(nextErrors);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: parsed.data.fullName,
        phoneNumber: parsed.data.phoneNumber || null,
        bio: parsed.data.bio || null,
        location: parsed.data.location || null,
        hometown: parsed.data.hometown || null,
        workplace: parsed.data.workplace || null,
        education: parsed.data.education || null,
        website: parsed.data.website || null,
        avatarUrl: editForm.avatarUrl,
        coverUrl: editForm.coverUrl,
      });
      setIsEditModalOpen(false);
      setEditErrors({});
      toast.success('Đã cập nhật hồ sơ cá nhân.');
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Không thể cập nhật hồ sơ cá nhân lúc này.';
      setEditErrors({ _form: message });
    }
  };

  const handleToggleFriendMenu = () => {
    setIsFriendMenuOpen((prev) => !prev);
  };

  const handleSendFriendRequest = async (targetUserId: string, targetName?: string) => {
    try {
      await sendRequestMutation.mutateAsync(targetUserId);
      toast.success(
        targetName
          ? `Đã gửi lời mời kết bạn tới ${targetName}.`
          : 'Đã gửi lời mời kết bạn.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi lời mời kết bạn.');
    }
  };

  const handleCancelFriendRequest = async (targetUserId: string, targetName?: string) => {
    try {
      await cancelRequestMutation.mutateAsync(targetUserId);
      toast.info(
        targetName
          ? `Đã hủy lời mời kết bạn với ${targetName}.`
          : 'Đã hủy lời mời kết bạn.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy lời mời kết bạn.');
    }
  };

  const handleAcceptFriendRequest = async (targetUserId: string, targetName?: string) => {
    try {
      await acceptRequestMutation.mutateAsync(targetUserId);
      toast.success(
        targetName
          ? `Bạn và ${targetName} đã trở thành bạn bè.`
          : 'Đã chấp nhận lời mời kết bạn.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chấp nhận lời mời kết bạn.');
    }
  };

  const handleRejectFriendRequest = async (targetUserId: string, targetName?: string) => {
    try {
      await rejectRequestMutation.mutateAsync(targetUserId);
      toast.info(
        targetName
          ? `Đã từ chối lời mời kết bạn của ${targetName}.`
          : 'Đã từ chối lời mời kết bạn.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể từ chối lời mời kết bạn.');
    }
  };

  const handleRequestUnfriend = (targetUserId: string, targetFullName: string) => {
    setIsFriendMenuOpen(false);
    setUnfriendTarget({ id: targetUserId, fullName: targetFullName });
  };

  const handleCancelUnfriend = () => {
    if (unfriendMutation.isPending) return;
    setUnfriendTarget(null);
  };

  const handleConfirmUnfriend = async () => {
    if (!unfriendTarget) return;
    const target = unfriendTarget;
    try {
      await unfriendMutation.mutateAsync(target.id);
      setUnfriendTarget(null);
      toast.info(`Đã hủy kết bạn với ${target.fullName}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy kết bạn lúc này.');
    }
  };

  const activityFeed = useMemo(
    () =>
      activityQuery.data ?? {
        tagged: [],
        reacted: [],
        saved: [],
        authored: [],
      },
    [activityQuery.data],
  );

  const activeActivityTab: ProfileActivityTabKey = useMemo(() => {
    if (isOwnProfile) {
      return activityTab === 'reacted' || activityTab === 'saved' ? activityTab : 'tagged';
    }
    return activityTab === 'tagged' ? 'tagged' : 'authored';
  }, [isOwnProfile, activityTab]);

  const activityItems = useMemo<ProfileActivityItem[]>(() => {
    return activityFeed[activeActivityTab] ?? [];
  }, [activityFeed, activeActivityTab]);

  const activityCounts = useMemo(
    () => ({
      tagged: activityFeed.tagged.length,
      reacted: activityFeed.reacted.length,
      saved: activityFeed.saved.length,
      authored: activityFeed.authored.length,
    }),
    [activityFeed],
  );

  const handleSelectActivityTab = (tab: ProfileActivityTabKey) => {
    setActivityTab(tab);
  };

  const handleNavigateToMyPosts = () => {
    navigate(`${ROUTES.CLIENT.ROOT}?tab=mine`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefetchProfile = () => {
    void profileQuery.refetch();
    void directoryQuery.refetch();
    void activityQuery.refetch();
  };

  return {
    currentUser,
    profile,
    isOwnProfile,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    activeTab,
    activityTab: activeActivityTab,
    activityItems,
    activityCounts,
    isLoadingActivity: activityQuery.isLoading,
    friendsFilter,
    friendSearchQuery,
    filteredFriendsList,
    overviewFriends,
    friendsTabCounts,
    incomingRequests: directory.incomingRequests,
    suggestedConnections: directory.suggestions,
    coverPresets: PROFILE_COVER_PRESETS,
    isEditModalOpen,
    editForm,
    editErrors,
    isSavingProfile: updateProfileMutation.isPending,
    isFriendshipMutating,
    isFriendMenuOpen,
    friendMenuRef,
    unfriendTarget,
    isUnfriending: unfriendMutation.isPending,
    handleSelectTab,
    handleSelectActivityTab,
    handleNavigateToMyPosts,
    handleSelectFriendsFilter,
    handleFriendSearchChange,
    handleClearFriendSearch,
    handleNavigateBackToFeed,
    handleOpenUserProfile,
    handleOpenMessages,
    handleCopyProfileLink,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditFormChange,
    handleSelectCoverPreset,
    handlePickAvatarFile,
    handlePickCoverFile,
    handleRemoveAvatar,
    handleSaveProfile,
    handleToggleFriendMenu,
    handleSendFriendRequest,
    handleCancelFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRequestUnfriend,
    handleCancelUnfriend,
    handleConfirmUnfriend,
    handleRefetchProfile,
  };
}

export type ProfileController = ReturnType<typeof useProfileController>;
