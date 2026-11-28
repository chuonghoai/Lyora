import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isApiError, toast, useAuthStore, useClickOutside } from "@/core";
import {
  PROFILE_COVER_PRESETS,
  updateExtendedProfileSchema,
  useProfileActivityQuery,
  useProfilePageQuery,
  useUpdateExtendedProfileMutation,
  useUploadProfileImageMutation,
  type ProfileActivityItem,
  type ProfileActivityTabKey,
  type ProfileFriendsFilter,
  type ProfileFriendSummary,
  type ProfileTabKey,
  type PublicUserProfile,
} from "@/features/user";
import {
  useAcceptFriendRequestMutation,
  useAcceptedFriendsQuery,
  useReceivedFriendRequestsQuery,
  useRemoveFriendRequestMutation,
  useSendFriendRequestMutation,
  useUnfriendMutation,
  type FriendDiscoveryItem,
} from "@/features/friends";
import { getClientProfilePath, ROUTES } from "@/routes/paths";
import {
  usePostFeedController,
  type FriendContactItem,
} from "../home/post-feed.controller";
import type { VisibilityFilterOption } from "../home/home.controller";

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

function buildEditFormState(
  profile?: PublicUserProfile | null,
): ProfileEditModalFormState {
  return {
    fullName: profile?.fullName ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    hometown: profile?.hometown ?? "",
    workplace: profile?.workplace ?? "",
    education: profile?.education ?? "",
    website: profile?.website ?? "",
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
  const acceptedFriendsQuery = useAcceptedFriendsQuery();
  const receivedRequestsQuery = useReceivedFriendRequestsQuery();
  const activityQuery = useProfileActivityQuery(userId);

  const updateProfileMutation = useUpdateExtendedProfileMutation();
  const uploadProfileImageMutation = useUploadProfileImageMutation();
  const sendRequestMutation = useSendFriendRequestMutation();
  const removeRequestMutation = useRemoveFriendRequestMutation();
  const acceptRequestMutation = useAcceptFriendRequestMutation();
  const unfriendMutation = useUnfriendMutation();

  const tabParam = searchParams.get("tab");
  const activeTab: ProfileTabKey =
    tabParam === "about" || tabParam === "friends" || tabParam === "activity"
      ? tabParam
      : "overview";

  const [profileVisibilityFilter, setProfileVisibilityFilter] =
    useState<VisibilityFilterOption>("ALL");
  const [friendsFilter, setFriendsFilter] =
    useState<ProfileFriendsFilter>("ALL");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditModalFormState>(() =>
    buildEditFormState(profileQuery.data),
  );
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
  const [unfriendTarget, setUnfriendTarget] =
    useState<UnfriendTargetState | null>(null);

  const pendingAvatarFileRef = useRef<File | null>(null);
  const pendingCoverFileRef = useRef<File | null>(null);
  const previewBlobUrlsRef = useRef<Set<string>>(new Set());
  const friendMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(friendMenuRef, () => setIsFriendMenuOpen(false));

  const profile = useMemo(() => {
    const profileFromQuery = profileQuery.data ?? null;
    if (!profileFromQuery || profileFromQuery.friendshipStatus === "SELF") {
      return profileFromQuery;
    }

    const isAcceptedFriend = (acceptedFriendsQuery.data ?? []).some(
      (friend) => friend.id === profileFromQuery.id,
    );
    return isAcceptedFriend
      ? { ...profileFromQuery, friendshipStatus: "FRIEND" as const }
      : profileFromQuery;
  }, [acceptedFriendsQuery.data, profileQuery.data]);
  const isOwnProfile = Boolean(
    profile
      ? profile.friendshipStatus === "SELF"
      : !userId ||
          userId === "me" ||
          (currentUser?.id && userId === currentUser.id),
  );

  const [activityTab, setActivityTab] =
    useState<ProfileActivityTabKey>("tagged");

  // Chuyển URL /me về /{userId} mặc định khi đã xác định user hiện tại
  useEffect(() => {
    if (userId === "me" && currentUser?.id) {
      navigate(getClientProfilePath(currentUser.id), { replace: true });
    }
  }, [userId, currentUser?.id, navigate]);

  const releasePendingMediaPreviews = () => {
    pendingAvatarFileRef.current = null;
    pendingCoverFileRef.current = null;
    previewBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewBlobUrlsRef.current.clear();
  };

  useEffect(() => {
    return () => {
      previewBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewBlobUrlsRef.current.clear();
    };
  }, []);

  // Reset bộ lọc & modal khi chuyển giữa các hồ sơ khác nhau
  useEffect(() => {
    setProfileVisibilityFilter("ALL");
    setFriendsFilter("ALL");
    setFriendSearchQuery("");
    setIsEditModalOpen(false);
    setIsFriendMenuOpen(false);
    setUnfriendTarget(null);
    releasePendingMediaPreviews();
  }, [userId]);

  useEffect(() => {
    setActivityTab("tagged");
  }, [userId, isOwnProfile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (unfriendTarget) {
        setUnfriendTarget(null);
      } else if (isEditModalOpen) {
        setIsEditModalOpen(false);
      } else if (isFriendMenuOpen) {
        setIsFriendMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [unfriendTarget, isEditModalOpen, isFriendMenuOpen]);

  const toProfileFriendSummary = (
    friend: FriendDiscoveryItem,
  ): ProfileFriendSummary => ({
    id: friend.id,
    fullName: friend.fullName,
    avatarUrl: friend.avatarUrl,
    headline: friend.workplace,
    location: friend.location,
    mutualFriendsCount: friend.mutualFriendsCount,
    friendshipStatus: friend.friendshipStatus,
    isOnline: friend.isOnline ?? false,
  });

  const acceptedFriends = useMemo(
    () => (acceptedFriendsQuery.data ?? []).map(toProfileFriendSummary),
    [acceptedFriendsQuery.data],
  );
  const receivedRequests = useMemo(
    () => (receivedRequestsQuery.data ?? []).map(toProfileFriendSummary),
    [receivedRequestsQuery.data],
  );

  // Trong danh sách bạn bè của một hồ sơ khác, một người là "bạn chung"
  // khi cả người xem và chủ hồ sơ đều đang là bạn với người đó. API biểu thị
  // điều này qua trạng thái FRIEND của mối quan hệ trực tiếp với người xem.
  // Không dùng số bạn chung giữa người xem và chính thẻ thành viên vì đó là
  // một quan hệ khác, khiến bộ lọc "Bạn chung" bỏ sót người bạn chung thật.
  const profileFriends = useMemo<ProfileFriendSummary[]>(
    () =>
      (profile?.friendsPreview ?? []).map((friend) => ({
        ...friend,
        mutualFriendsCount: friend.friendshipStatus === "FRIEND" ? 1 : 0,
      })),
    [profile?.friendsPreview],
  );

  const overviewFriends = useMemo<ProfileFriendSummary[]>(() => {
    const list = isOwnProfile ? acceptedFriends : profileFriends;
    return list.slice(0, 6);
  }, [isOwnProfile, acceptedFriends, profileFriends]);

  const friendsForFeed = useMemo<FriendContactItem[]>(() => {
    const list = isOwnProfile ? acceptedFriends : profileFriends;
    return list.map((friend) => ({
      id: friend.id,
      fullName: friend.fullName,
      avatarUrl: friend.avatarUrl,
      isOnline: Boolean(friend.isOnline),
    }));
  }, [isOwnProfile, acceptedFriends, profileFriends]);

  const handleOpenUserProfile = (targetUserId: string) => {
    setIsFriendMenuOpen(false);
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resolvedTargetAuthorId = isOwnProfile
    ? (profile?.id ?? currentUser?.id)
    : (profile?.id ?? userId);

  const postFeed = usePostFeedController({
    limit: 10,
    filter: isOwnProfile ? "mine" : "all",
    authorId: resolvedTargetAuthorId,
    visibility:
      profileVisibilityFilter === "ALL" ? undefined : profileVisibilityFilter,
    enabled: Boolean(resolvedTargetAuthorId),
    friends: friendsForFeed,
    profileUser: profile ?? currentUser,
    hasBlockingExternalModal: isEditModalOpen || Boolean(unfriendTarget),
    onOpenUserProfile: handleOpenUserProfile,
  });

  const friendsTabCounts = useMemo(() => {
    if (isOwnProfile) {
      return {
        all: acceptedFriends.length,
        mutual: 0,
        requests: receivedRequests.length,
        incomingRequests: receivedRequests.length,
        sentRequests: 0,
        suggestions: 0,
      };
    }

    const otherFriends = profileFriends;
    const mutualList = otherFriends.filter(
      (item) => item.mutualFriendsCount > 0,
    );
    return {
      all: otherFriends.length,
      mutual: mutualList.length,
      requests: 0,
      incomingRequests: 0,
      sentRequests: 0,
      suggestions: 0,
    };
  }, [
    isOwnProfile,
    acceptedFriends,
    receivedRequests,
    profileFriends,
  ]);

  const filteredFriendsList = useMemo<ProfileFriendSummary[]>(() => {
    let source: ProfileFriendSummary[] = [];

    if (isOwnProfile) {
      if (friendsFilter === "REQUESTS") {
        source = receivedRequests;
      } else if (friendsFilter === "SUGGESTIONS") {
        source = [];
      } else {
        source = acceptedFriends;
      }
    } else {
      const otherFriends = profileFriends;
      source =
        friendsFilter === "MUTUAL"
          ? otherFriends.filter((item) => item.mutualFriendsCount > 0)
          : otherFriends;
    }

    const keyword = friendSearchQuery.trim().toLowerCase();
    if (!keyword) return source;
    return source.filter((item) => {
      const matchName = item.fullName.toLowerCase().includes(keyword);
      const matchLocation =
        item.location?.toLowerCase().includes(keyword) ?? false;
      const matchHeadline =
        item.headline?.toLowerCase().includes(keyword) ?? false;
      return matchName || matchLocation || matchHeadline;
    });
  }, [
    isOwnProfile,
    friendsFilter,
    acceptedFriends,
    receivedRequests,
    profileFriends,
    friendSearchQuery,
  ]);

  const isFriendshipMutating =
    sendRequestMutation.isPending ||
    removeRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    unfriendMutation.isPending;

  const handleSelectTab = (tab: ProfileTabKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "overview") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleSelectProfileVisibilityFilter = (
    filter: VisibilityFilterOption,
  ) => {
    setProfileVisibilityFilter(filter);
  };

  const handleSelectFriendsFilter = (filter: ProfileFriendsFilter) => {
    setFriendsFilter(filter);
  };

  const handleFriendSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendSearchQuery(e.target.value);
  };

  const handleClearFriendSearch = () => {
    setFriendSearchQuery("");
  };

  const handleNavigateBackToFeed = () => {
    navigate(ROUTES.CLIENT.ROOT);
  };

  const handleOpenMessages = () => {
    setIsFriendMenuOpen(false);
    navigate(ROUTES.CLIENT.MESSAGES);
  };

  const handleCopyProfileLink = async () => {
    if (!profile) return;
    const path = getClientProfilePath(profile.id, currentUser?.id);
    const shareUrl = `${window.location.origin}${path}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success("Đã sao chép liên kết trang cá nhân.");
    } catch {
      toast.info("Không thể truy cập bộ nhớ tạm trên trình duyệt.");
    }
  };

  const handleOpenEditModal = () => {
    releasePendingMediaPreviews();
    setEditForm(buildEditFormState(profile));
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (updateProfileMutation.isPending || uploadProfileImageMutation.isPending)
      return;
    releasePendingMediaPreviews();
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
    pendingCoverFileRef.current = null;
    setEditForm((prev) => ({ ...prev, coverUrl: url }));
  };

  const handlePickAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn tệp hình ảnh hợp lệ cho ảnh đại diện.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.warning("Ảnh đại diện có dung lượng tối đa 5MB.");
      return;
    }

    pendingAvatarFileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    previewBlobUrlsRef.current.add(objectUrl);
    setEditForm((prev) => ({ ...prev, avatarUrl: objectUrl }));
  };

  const handlePickCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn tệp hình ảnh hợp lệ cho ảnh bìa.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.warning("Ảnh bìa có dung lượng tối đa 5MB.");
      return;
    }

    pendingCoverFileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    previewBlobUrlsRef.current.add(objectUrl);
    setEditForm((prev) => ({ ...prev, coverUrl: objectUrl }));
  };

  const handleRemoveAvatar = () => {
    pendingAvatarFileRef.current = null;
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
        const field = String(issue.path[0] ?? "_form");
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setEditErrors(nextErrors);
      return;
    }

    try {
      let resolvedAvatarUrl = editForm.avatarUrl;
      if (pendingAvatarFileRef.current) {
        resolvedAvatarUrl = await uploadProfileImageMutation.mutateAsync(
          pendingAvatarFileRef.current,
        );
      }

      let resolvedCoverUrl = editForm.coverUrl;
      if (pendingCoverFileRef.current) {
        resolvedCoverUrl = await uploadProfileImageMutation.mutateAsync(
          pendingCoverFileRef.current,
        );
      }

      await updateProfileMutation.mutateAsync({
        fullName: parsed.data.fullName,
        phoneNumber: parsed.data.phoneNumber || null,
        bio: parsed.data.bio || null,
        location: parsed.data.location || null,
        hometown: parsed.data.hometown || null,
        workplace: parsed.data.workplace || null,
        education: parsed.data.education || null,
        website: parsed.data.website || null,
        avatarUrl: resolvedAvatarUrl,
        coverUrl: resolvedCoverUrl,
      });
      releasePendingMediaPreviews();
      setIsEditModalOpen(false);
      setEditErrors({});
      toast.success("Đã cập nhật hồ sơ cá nhân.");
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "Không thể cập nhật hồ sơ cá nhân lúc này.";
      setEditErrors({ _form: message });
    }
  };

  const handleToggleFriendMenu = () => {
    setIsFriendMenuOpen((prev) => !prev);
  };

  const handleSendFriendRequest = async (
    targetUserId: string,
    targetName?: string,
  ) => {
    try {
      await sendRequestMutation.mutateAsync(targetUserId);
      toast.success(
        targetName
          ? `Đã gửi lời mời kết bạn tới ${targetName}.`
          : "Đã gửi lời mời kết bạn.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể gửi lời mời kết bạn.",
      );
    }
  };

  const handleCancelFriendRequest = async (
    targetUserId: string,
    targetName?: string,
  ) => {
    try {
      await removeRequestMutation.mutateAsync(targetUserId);
      toast.info(
        targetName
          ? `Đã hủy lời mời kết bạn với ${targetName}.`
          : "Đã hủy lời mời kết bạn.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể hủy lời mời kết bạn.",
      );
    }
  };

  const handleAcceptFriendRequest = async (
    targetUserId: string,
    targetName?: string,
  ) => {
    try {
      await acceptRequestMutation.mutateAsync(targetUserId);
      toast.success(
        targetName
          ? `Bạn và ${targetName} đã trở thành bạn bè.`
          : "Đã chấp nhận lời mời kết bạn.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể chấp nhận lời mời kết bạn.",
      );
    }
  };

  const handleRejectFriendRequest = async (
    targetUserId: string,
    targetName?: string,
  ) => {
    try {
      await removeRequestMutation.mutateAsync(targetUserId);
      toast.info(
        targetName
          ? `Đã từ chối lời mời kết bạn của ${targetName}.`
          : "Đã từ chối lời mời kết bạn.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể từ chối lời mời kết bạn.",
      );
    }
  };

  const handleRequestUnfriend = (
    targetUserId: string,
    targetFullName: string,
  ) => {
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
      toast.error(
        err instanceof Error ? err.message : "Không thể hủy kết bạn lúc này.",
      );
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
      return activityTab === "reacted" || activityTab === "saved"
        ? activityTab
        : "tagged";
    }
    return "tagged";
  }, [isOwnProfile, activityTab]);

  const activityItems = useMemo<ProfileActivityItem[]>(() => {
    return activityFeed[activeActivityTab] ?? [];
  }, [activityFeed, activeActivityTab]);

  const activityCounts = useMemo(
    () => ({
      tagged: activityFeed.tagged.length,
      reacted: activityFeed.reacted.length,
      saved: activityFeed.saved.length,
      totalGrouped:
        activityFeed.tagged.length +
        activityFeed.reacted.length +
        activityFeed.saved.length,
    }),
    [activityFeed],
  );

  const handleSelectActivityTab = (tab: ProfileActivityTabKey) => {
    setActivityTab(tab);
  };

  const handleOpenActivityTab = (tab: ProfileActivityTabKey) => {
    setActivityTab(tab);
    handleSelectTab("activity");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateToMyPosts = () => {
    handleSelectTab("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefetchProfile = () => {
    void profileQuery.refetch();
    void acceptedFriendsQuery.refetch();
    void receivedRequestsQuery.refetch();
    void activityQuery.refetch();
    void postFeed.handleRefreshFeed();
  };

  return {
    ...postFeed,
    currentUser,
    profile,
    isOwnProfile,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    activeTab,
    profileVisibilityFilter,
    activityTab: activeActivityTab,
    activityItems,
    activityCounts,
    isLoadingActivity: activityQuery.isLoading,
    friendsFilter,
    friendSearchQuery,
    filteredFriendsList,
    overviewFriends,
    friendsTabCounts,
    incomingRequests: receivedRequests,
    suggestedConnections: [] as ProfileFriendSummary[],
    coverPresets: PROFILE_COVER_PRESETS,
    isEditModalOpen,
    editForm,
    editErrors,
    isSavingProfile:
      updateProfileMutation.isPending || uploadProfileImageMutation.isPending,
    isFriendshipMutating,
    isFriendMenuOpen,
    friendMenuRef,
    unfriendTarget,
    isUnfriending: unfriendMutation.isPending,
    handleSelectTab,
    handleSelectProfileVisibilityFilter,
    handleSelectActivityTab,
    handleOpenActivityTab,
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
