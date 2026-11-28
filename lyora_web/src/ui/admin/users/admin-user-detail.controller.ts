import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore } from '@/core';
import {
  useInfinitePostsQuery,
  usePostReactionsQuery,
  usePostSharesQuery,
  type Post,
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

  const handleAdminDeletePost = () => {
    // TODO: Đang phát triển
    toast.info('// TODO: Đang phát triển');
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
    handleAdminDeletePost,
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
