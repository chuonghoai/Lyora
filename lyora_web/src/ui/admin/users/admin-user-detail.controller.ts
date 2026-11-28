import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore } from '@/core';
import {
  hidePostModerationSchema,
  removeModerationReasonSchema,
  useHideAdminPostMutation,
  useInfinitePostsQuery,
  usePostReactionsQuery,
  usePostSharesQuery,
  useRemoveAdminCommentMutation,
  useRemoveAdminPostMutation,
  type Post,
  type PostComment,
  type PostVisibility,
  type ReactionType,
} from '@/features/posts';
import {
  useAdminUserDetailQuery,
  useLockUserMutation,
  useUnlockUserMutation,
} from '@/features/user';
import { getAdminUserDetailPath, ROUTES } from '@/routes/paths';
import type { AdminPostReactionsModalState } from './AdminPostReactionsModal';
import type { AdminUserModerationTarget } from './AdminUserPostModerationModal';

export type AdminUserPostVisibilityFilter = 'ALL' | PostVisibility;

export interface AdminPostSharesModalState {
  postId: string;
  page: number;
}

export function useAdminUserDetailController() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentAdmin = useAuthStore((s) => s.user);

  const [visibilityFilter, setVisibilityFilter] =
    useState<AdminUserPostVisibilityFilter>('ALL');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<
    Record<string, boolean>
  >({});
  const [reactionsModal, setReactionsModal] =
    useState<AdminPostReactionsModalState | null>(null);
  const [sharesModal, setSharesModal] =
    useState<AdminPostSharesModalState | null>(null);
  const [moderationTarget, setModerationTarget] =
    useState<AdminUserModerationTarget | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationError, setModerationError] = useState<string | null>(null);

  const userQuery = useAdminUserDetailQuery(userId);
  const postsQuery = useInfinitePostsQuery(
    {
      authorId: userId,
      limit: 10,
      visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
    },
    { enabled: Boolean(userId) },
  );

  const reactionsQuery = usePostReactionsQuery(reactionsModal?.postId ?? null, {
    page: reactionsModal?.page ?? 1,
    limit: 10,
    reactionType: reactionsModal?.reactionType,
  });

  const sharesQuery = usePostSharesQuery(sharesModal?.postId ?? null, {
    page: sharesModal?.page ?? 1,
    limit: 10,
  });

  const lockMutation = useLockUserMutation();
  const unlockMutation = useUnlockUserMutation();
  const hidePostMutation = useHideAdminPostMutation();
  const removePostMutation = useRemoveAdminPostMutation();
  const removeCommentMutation = useRemoveAdminCommentMutation();

  const isModeratingPost =
    hidePostMutation.isPending ||
    removePostMutation.isPending ||
    removeCommentMutation.isPending;

  const user = userQuery.data ?? null;
  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );
  const totalPosts = postsQuery.data?.pages[0]?.meta.totalItems ?? posts.length;

  const reactionsModalPost = useMemo<Post | null>(() => {
    if (!reactionsModal) return null;
    return posts.find((item) => item.id === reactionsModal.postId) ?? null;
  }, [posts, reactionsModal]);

  const sharesModalPost = useMemo<Post | null>(() => {
    if (!sharesModal) return null;
    return posts.find((item) => item.id === sharesModal.postId) ?? null;
  }, [posts, sharesModal]);

  useEffect(() => {
    if (!reactionsModal && !sharesModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (reactionsModal) setReactionsModal(null);
        else if (sharesModal) setSharesModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reactionsModal, sharesModal]);

  const isSelfAccount = Boolean(
    user && currentAdmin?.id && user.id === currentAdmin.id,
  );
  const canLockTarget = Boolean(
    user && user.isActive && !isSelfAccount && user.role !== 'ADMIN',
  );
  const canUnlockTarget = Boolean(user && !user.isActive);

  const handleBackToList = () => {
    navigate(ROUTES.ADMIN.USERS);
  };

  const handleRefreshAll = () => {
    void userQuery.refetch();
    void postsQuery.refetch();
  };

  const handleOpenLockModal = () => {
    if (!canLockTarget) return;
    setIsLockModalOpen(true);
  };

  const handleCloseLockModal = () => {
    if (lockMutation.isPending) return;
    setIsLockModalOpen(false);
  };

  const handleConfirmLock = async (reason: string) => {
    if (!user) return;
    try {
      await lockMutation.mutateAsync({
        userId: user.id,
        payload: { reason },
      });
      setIsLockModalOpen(false);
      toast.success(`Đã khóa tài khoản ${user.fullName}.`);
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể khóa tài khoản người dùng lúc này.',
      );
    }
  };

  const handleOpenUnlockConfirm = () => {
    if (!canUnlockTarget) return;
    setIsUnlockConfirmOpen(true);
  };

  const handleCloseUnlockConfirm = () => {
    if (unlockMutation.isPending) return;
    setIsUnlockConfirmOpen(false);
  };

  const handleConfirmUnlock = async () => {
    if (!user) return;
    try {
      await unlockMutation.mutateAsync(user.id);
      setIsUnlockConfirmOpen(false);
      toast.success(`Đã mở khóa tài khoản ${user.fullName}.`);
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể mở khóa tài khoản người dùng lúc này.',
      );
    }
  };

  // TODO: Đang phát triển — các thao tác kiểm duyệt bên dưới được ghi nhận trong admin_manage_user.todo
  const handleFlagCoverViolation = () => {
    // TODO: Đang phát triển
    toast.info('// TODO: Đang phát triển');
  };

  const handleFlagAvatarViolation = () => {
    // TODO: Đang phát triển
    toast.info('// TODO: Đang phát triển');
  };

  const handleFlagPostViolation = () => {
    // TODO: Đang phát triển
    toast.info('// TODO: Đang phát triển');
  };

  const handleOpenHidePostModal = (post: Post) => {
    setModerationTarget({ mode: 'HIDE_POST', post });
    setModerationReason('');
    setModerationError(null);
  };

  const handleOpenRemovePostModal = (post: Post) => {
    setModerationTarget({ mode: 'REMOVE_POST', post });
    setModerationReason('');
    setModerationError(null);
  };

  const handleOpenRemoveCommentModal = (postId: string, comment: PostComment) => {
    setModerationTarget({ mode: 'REMOVE_COMMENT', postId, comment });
    setModerationReason('');
    setModerationError(null);
  };

  const handleCloseModerationModal = () => {
    if (isModeratingPost) return;
    setModerationTarget(null);
    setModerationReason('');
    setModerationError(null);
  };

  const handleModerationReasonChange = (value: string) => {
    setModerationReason(value);
    if (moderationError) setModerationError(null);
  };

  const handleSelectModerationReasonPreset = (preset: string) => {
    setModerationReason(preset);
    if (moderationError) setModerationError(null);
  };

  const handleConfirmModeration = async (event: FormEvent) => {
    event.preventDefault();
    if (!moderationTarget || isModeratingPost) return;

    if (moderationTarget.mode === 'HIDE_POST') {
      const parsed = hidePostModerationSchema.safeParse({
        reason: moderationReason,
      });
      if (!parsed.success) {
        setModerationError(
          parsed.error.issues[0]?.message ?? 'Lý do ẩn bài viết chưa hợp lệ',
        );
        return;
      }

      const targetPostId = moderationTarget.post.id;
      try {
        await hidePostMutation.mutateAsync({
          postId: targetPostId,
          reason: parsed.data.reason,
        });
        setModerationTarget(null);
        setModerationReason('');
        setModerationError(null);
        if (reactionsModal?.postId === targetPostId) setReactionsModal(null);
        if (sharesModal?.postId === targetPostId) setSharesModal(null);
        toast.success('Đã ẩn bài viết vi phạm và gửi thông báo cho tác giả.');
      } catch (err) {
        toast.error(
          isApiError(err) ? err.message : 'Không thể ẩn bài viết lúc này.',
        );
      }
      return;
    }

    const parsed = removeModerationReasonSchema.safeParse({
      reason: moderationReason,
    });
    if (!parsed.success) {
      setModerationError(
        parsed.error.issues[0]?.message ?? 'Lý do gỡ bỏ chưa hợp lệ',
      );
      return;
    }
    const cleanReason = parsed.data.reason || undefined;

    if (moderationTarget.mode === 'REMOVE_POST') {
      const targetPostId = moderationTarget.post.id;
      try {
        await removePostMutation.mutateAsync({
          postId: targetPostId,
          reason: cleanReason,
        });
        setModerationTarget(null);
        setModerationReason('');
        setModerationError(null);
        if (reactionsModal?.postId === targetPostId) setReactionsModal(null);
        if (sharesModal?.postId === targetPostId) setSharesModal(null);
        toast.success('Đã gỡ bỏ bài viết khỏi hệ thống.');
      } catch (err) {
        toast.error(
          isApiError(err) ? err.message : 'Không thể gỡ bỏ bài viết lúc này.',
        );
      }
      return;
    }

    try {
      await removeCommentMutation.mutateAsync({
        postId: moderationTarget.postId,
        commentId: moderationTarget.comment.id,
        reason: cleanReason,
      });
      setModerationTarget(null);
      setModerationReason('');
      setModerationError(null);
      toast.success('Đã gỡ bỏ bình luận vi phạm.');
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : 'Không thể gỡ bỏ bình luận lúc này.',
      );
    }
  };

  const handleTogglePostComments = (postId: string) => {
    setExpandedCommentsMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleOpenReactionsModal = (postId: string) => {
    setReactionsModal({ postId, page: 1, reactionType: undefined });
  };

  const handleCloseReactionsModal = () => {
    setReactionsModal(null);
  };

  const handleChangeReactionsFilter = (reactionType?: ReactionType) => {
    setReactionsModal((prev) =>
      prev ? { ...prev, page: 1, reactionType } : null,
    );
  };

  const handleChangeReactionsPage = (page: number) => {
    setReactionsModal((prev) => (prev ? { ...prev, page } : null));
  };

  const handleRetryReactions = () => {
    void reactionsQuery.refetch();
  };

  const handleOpenSharesModal = (postId: string) => {
    setSharesModal({ postId, page: 1 });
  };

  const handleCloseSharesModal = () => {
    setSharesModal(null);
  };

  const handleChangeSharesPage = (page: number) => {
    setSharesModal((prev) => (prev ? { ...prev, page } : null));
  };

  const handleRetryShares = () => {
    void sharesQuery.refetch();
  };

  const handleInspectUserProfile = (targetUserId: string) => {
    setReactionsModal(null);
    setSharesModal(null);
    navigate(getAdminUserDetailPath(targetUserId));
  };

  return {
    userId,
    user,
    posts,
    totalPosts,
    visibilityFilter,
    isSelfAccount,
    canLockTarget,
    canUnlockTarget,
    isLoadingUser: userQuery.isLoading,
    isUserError: userQuery.isError,
    isLoadingPosts: postsQuery.isLoading,
    isPostsError: postsQuery.isError,
    hasNextPostsPage: Boolean(postsQuery.hasNextPage),
    isFetchingNextPosts: postsQuery.isFetchingNextPage,
    isFetchNextPostsError: postsQuery.isFetchNextPageError,
    isLockModalOpen,
    isLockingUser: lockMutation.isPending,
    isUnlockConfirmOpen,
    isUnlockingUser: unlockMutation.isPending,
    expandedCommentsMap,
    reactionsModal,
    reactionsModalPost,
    reactionsData: reactionsQuery.data,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isReactionsError: reactionsQuery.isError,
    sharesModal,
    sharesModalPost,
    sharesData: sharesQuery.data,
    isSharesLoading: sharesQuery.isLoading || sharesQuery.isFetching,
    isSharesError: sharesQuery.isError,
    moderationTarget,
    moderationReason,
    moderationError,
    isModeratingPost,
    setVisibilityFilter,
    handleBackToList,
    handleRefreshAll,
    handleLoadMorePosts: () => void postsQuery.fetchNextPage(),
    handleRetryPosts: () => void postsQuery.refetch(),
    handleOpenLockModal,
    handleCloseLockModal,
    handleConfirmLock,
    handleOpenUnlockConfirm,
    handleCloseUnlockConfirm,
    handleConfirmUnlock,
    handleFlagCoverViolation,
    handleFlagAvatarViolation,
    handleFlagPostViolation,
    handleOpenHidePostModal,
    handleOpenRemovePostModal,
    handleOpenRemoveCommentModal,
    handleCloseModerationModal,
    handleModerationReasonChange,
    handleSelectModerationReasonPreset,
    handleConfirmModeration,
    handleTogglePostComments,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    handleChangeReactionsFilter,
    handleChangeReactionsPage,
    handleRetryReactions,
    handleOpenSharesModal,
    handleCloseSharesModal,
    handleChangeSharesPage,
    handleRetryShares,
    handleInspectUserProfile,
  };
}

export type AdminUserDetailController = ReturnType<
  typeof useAdminUserDetailController
>;
