import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore } from '@/core';
import {
  flagPostViolationSchema,
  hidePostModerationSchema,
  rejectPostAppealSchema,
  removeModerationReasonSchema,
  useFlagAdminPostViolationMutation,
  useHideAdminPostMutation,
  useInfinitePostCommentsQuery,
  useInfinitePostsQuery,
  usePostDetailQuery,
  usePostReactionsQuery,
  usePostSharesQuery,
  useRejectAdminPostAppealMutation,
  useRemoveAdminCommentMutation,
  useRemoveAdminPostMutation,
  useRestoreAdminPostAppealMutation,
  useRestoreAdminPostMutation,
  useUnflagAdminPostViolationMutation,
  type Post,
  type PostAppealSummary,
  type PostComment,
  type PostVisibility,
  type ReactionType,
} from '@/features/posts';
import {
  flagProfileMediaViolationSchema,
  useAdminUserDetailQuery,
  useClearUserAvatarViolationMutation,
  useClearUserCoverViolationMutation,
  useFlagUserAvatarViolationMutation,
  useFlagUserCoverViolationMutation,
  useLockUserMutation,
  useUnlockUserMutation,
} from '@/features/user';
import { getAdminUserDetailPath, ROUTES } from '@/routes/paths';
import type { ViolationModalTarget } from '@/ui/shared/ViolationIndicators';
import type { AdminPostReactionsModalState } from './AdminPostReactionsModal';
import type { AdminUserAppealEvidenceTarget } from './AdminUserAppealEvidenceModal';
import type { AdminUserModerationTarget } from './AdminUserPostModerationModal';

export type AdminUserPostVisibilityFilter = 'ALL' | PostVisibility;

export interface AdminPostSharesModalState {
  postId: string;
  page: number;
}

export function useAdminUserDetailController() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentAdmin = useAuthStore((s) => s.user);

  const detailPostId = useMemo(
    () => searchParams.get('postId')?.trim() || null,
    [searchParams],
  );
  const detailAppealsExpanded = useMemo(
    () => searchParams.get('appeals') === 'expanded',
    [searchParams],
  );

  const [visibilityFilter, setVisibilityFilter] =
    useState<AdminUserPostVisibilityFilter>('ALL');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [reactionsModal, setReactionsModal] =
    useState<AdminPostReactionsModalState | null>(null);
  const [sharesModal, setSharesModal] =
    useState<AdminPostSharesModalState | null>(null);
  const [moderationTarget, setModerationTarget] =
    useState<AdminUserModerationTarget | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [violationDetailTarget, setViolationDetailTarget] =
    useState<ViolationModalTarget | null>(null);
  const [violationClearingKind, setViolationClearingKind] = useState<
    'AVATAR' | 'COVER' | 'POST' | null
  >(null);
  const [restoringPostId, setRestoringPostId] = useState<string | null>(null);
  const [restoreAppealTarget, setRestoreAppealTarget] =
    useState<AdminUserAppealEvidenceTarget | null>(null);
  const [evidenceAppealTarget, setEvidenceAppealTarget] =
    useState<AdminUserAppealEvidenceTarget | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const userQuery = useAdminUserDetailQuery(userId);
  const postsQuery = useInfinitePostsQuery(
    {
      authorId: userId,
      limit: 10,
      visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
    },
    { enabled: Boolean(userId) },
  );

  const detailPostQuery = usePostDetailQuery(detailPostId);
  const detailCommentsQuery = useInfinitePostCommentsQuery(detailPostId, 10);

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
  const flagAvatarViolationMutation = useFlagUserAvatarViolationMutation();
  const clearAvatarViolationMutation = useClearUserAvatarViolationMutation();
  const flagCoverViolationMutation = useFlagUserCoverViolationMutation();
  const clearCoverViolationMutation = useClearUserCoverViolationMutation();
  const hidePostMutation = useHideAdminPostMutation();
  const restorePostMutation = useRestoreAdminPostMutation();
  const flagPostViolationMutation = useFlagAdminPostViolationMutation();
  const unflagPostViolationMutation = useUnflagAdminPostViolationMutation();
  const removePostMutation = useRemoveAdminPostMutation();
  const removeCommentMutation = useRemoveAdminCommentMutation();
  const restoreAppealMutation = useRestoreAdminPostAppealMutation();
  const rejectAppealMutation = useRejectAdminPostAppealMutation();

  const isModeratingPost =
    hidePostMutation.isPending ||
    restorePostMutation.isPending ||
    flagPostViolationMutation.isPending ||
    unflagPostViolationMutation.isPending ||
    flagAvatarViolationMutation.isPending ||
    clearAvatarViolationMutation.isPending ||
    flagCoverViolationMutation.isPending ||
    clearCoverViolationMutation.isPending ||
    removePostMutation.isPending ||
    removeCommentMutation.isPending;

  const user = userQuery.data ?? null;
  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );
  const totalPosts = postsQuery.data?.pages[0]?.meta.totalItems ?? posts.length;

  const detailComments = useMemo(
    () => detailCommentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [detailCommentsQuery.data],
  );
  const totalDetailRootComments =
    detailCommentsQuery.data?.pages[0]?.meta.totalItems ?? 0;

  const isDetailPostNotFound = Boolean(
    detailPostId &&
      detailPostQuery.isError &&
      isApiError(detailPostQuery.error) &&
      detailPostQuery.error.statusCode === 404,
  );

  const reactionsModalPost = useMemo<Post | null>(() => {
    if (!reactionsModal) return null;
    if (detailPostQuery.data && detailPostQuery.data.id === reactionsModal.postId) {
      return detailPostQuery.data;
    }
    return posts.find((item) => item.id === reactionsModal.postId) ?? null;
  }, [posts, reactionsModal, detailPostQuery.data]);

  const sharesModalPost = useMemo<Post | null>(() => {
    if (!sharesModal) return null;
    if (detailPostQuery.data && detailPostQuery.data.id === sharesModal.postId) {
      return detailPostQuery.data;
    }
    return posts.find((item) => item.id === sharesModal.postId) ?? null;
  }, [posts, sharesModal, detailPostQuery.data]);

  const handleOpenPostDetail = useCallback(
    (postId: string, openOptions?: { expandAppeals?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('postId', postId);
          if (openOptions?.expandAppeals) {
            next.set('appeals', 'expanded');
          } else {
            next.delete('appeals');
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const handleClosePostDetail = useCallback(() => {
    setSearchParams(
      (prev) => {
        if (!prev.has('postId') && !prev.has('appeals')) return prev;
        const next = new URLSearchParams(prev);
        next.delete('postId');
        next.delete('appeals');
        return next;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const handleToggleDetailAppealsExpanded = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get('appeals') === 'expanded') {
          next.delete('appeals');
        } else {
          next.set('appeals', 'expanded');
        }
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (!reactionsModal && !sharesModal && !detailPostId && !restoreAppealTarget && !evidenceAppealTarget) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (moderationTarget || evidenceAppealTarget) return;
      if (restoreAppealTarget) {
        if (!restoreAppealMutation.isPending) setRestoreAppealTarget(null);
      } else if (reactionsModal) setReactionsModal(null);
      else if (sharesModal) setSharesModal(null);
      else if (detailPostId) handleClosePostDetail();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    reactionsModal,
    sharesModal,
    detailPostId,
    moderationTarget,
    restoreAppealTarget,
    evidenceAppealTarget,
    restoreAppealMutation.isPending,
    handleClosePostDetail,
  ]);

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
    if (detailPostId) {
      void detailPostQuery.refetch();
      void detailCommentsQuery.refetch();
    }
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

  const handleFlagCoverViolation = () => {
    if (!user) return;
    if (!user.coverUrl?.trim()) {
      toast.info('Người dùng hiện chưa có ảnh bìa để đánh dấu vi phạm.');
      return;
    }
    setModerationTarget({ mode: 'FLAG_COVER', user });
    setModerationReason(user.coverViolation?.reason ?? '');
    setModerationError(null);
  };

  const handleFlagAvatarViolation = () => {
    if (!user) return;
    if (!user.avatarUrl?.trim()) {
      toast.info('Người dùng hiện chưa có ảnh đại diện để đánh dấu vi phạm.');
      return;
    }
    setModerationTarget({ mode: 'FLAG_AVATAR', user });
    setModerationReason(user.avatarViolation?.reason ?? '');
    setModerationError(null);
  };

  const handleFlagPostViolation = (post: Post) => {
    setModerationTarget({ mode: 'FLAG_POST', post });
    setModerationReason(post.violationFlag?.reason ?? '');
    setModerationError(null);
  };

  const handleClearAvatarViolation = async () => {
    if (!user || clearAvatarViolationMutation.isPending) return;
    setViolationClearingKind('AVATAR');
    try {
      await clearAvatarViolationMutation.mutateAsync(user.id);
      if (violationDetailTarget?.kind === 'AVATAR') {
        setViolationDetailTarget(null);
      }
      toast.success('Đã gỡ đánh dấu vi phạm ảnh đại diện.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể gỡ đánh dấu vi phạm ảnh đại diện lúc này.',
      );
    } finally {
      setViolationClearingKind(null);
    }
  };

  const handleClearCoverViolation = async () => {
    if (!user || clearCoverViolationMutation.isPending) return;
    setViolationClearingKind('COVER');
    try {
      await clearCoverViolationMutation.mutateAsync(user.id);
      if (violationDetailTarget?.kind === 'COVER') {
        setViolationDetailTarget(null);
      }
      toast.success('Đã gỡ đánh dấu vi phạm ảnh bìa.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể gỡ đánh dấu vi phạm ảnh bìa lúc này.',
      );
    } finally {
      setViolationClearingKind(null);
    }
  };

  const handleUnflagPostViolation = async (postId: string) => {
    if (unflagPostViolationMutation.isPending) return;
    setViolationClearingKind('POST');
    try {
      await unflagPostViolationMutation.mutateAsync(postId);
      if (
        violationDetailTarget?.kind === 'POST' &&
        violationDetailTarget.postId === postId
      ) {
        setViolationDetailTarget(null);
      }
      toast.success('Đã gỡ đánh dấu vi phạm bài viết.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể gỡ đánh dấu vi phạm bài viết lúc này.',
      );
    } finally {
      setViolationClearingKind(null);
    }
  };

  const handleOpenViolationDetail = (target: ViolationModalTarget) => {
    setViolationDetailTarget(target);
  };

  const handleCloseViolationDetail = () => {
    if (violationClearingKind) return;
    setViolationDetailTarget(null);
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

    if (moderationTarget.mode === 'FLAG_AVATAR') {
      const parsed = flagProfileMediaViolationSchema.safeParse({
        reason: moderationReason,
      });
      if (!parsed.success) {
        setModerationError(
          parsed.error.issues[0]?.message ?? 'Lý do đánh dấu vi phạm chưa hợp lệ',
        );
        return;
      }

      try {
        await flagAvatarViolationMutation.mutateAsync({
          userId: moderationTarget.user.id,
          payload: { reason: parsed.data.reason },
        });
        setModerationTarget(null);
        setModerationReason('');
        setModerationError(null);
        toast.success('Đã đánh dấu vi phạm ảnh đại diện và gửi thông báo realtime.');
      } catch (err) {
        toast.error(
          isApiError(err)
            ? err.message
            : 'Không thể đánh dấu vi phạm ảnh đại diện lúc này.',
        );
      }
      return;
    }

    if (moderationTarget.mode === 'FLAG_COVER') {
      const parsed = flagProfileMediaViolationSchema.safeParse({
        reason: moderationReason,
      });
      if (!parsed.success) {
        setModerationError(
          parsed.error.issues[0]?.message ?? 'Lý do đánh dấu vi phạm chưa hợp lệ',
        );
        return;
      }

      try {
        await flagCoverViolationMutation.mutateAsync({
          userId: moderationTarget.user.id,
          payload: { reason: parsed.data.reason },
        });
        setModerationTarget(null);
        setModerationReason('');
        setModerationError(null);
        toast.success('Đã đánh dấu vi phạm ảnh bìa và gửi thông báo realtime.');
      } catch (err) {
        toast.error(
          isApiError(err)
            ? err.message
            : 'Không thể đánh dấu vi phạm ảnh bìa lúc này.',
        );
      }
      return;
    }

    if (moderationTarget.mode === 'FLAG_POST') {
      const parsed = flagPostViolationSchema.safeParse({
        reason: moderationReason,
      });
      if (!parsed.success) {
        setModerationError(
          parsed.error.issues[0]?.message ?? 'Lý do đánh dấu vi phạm chưa hợp lệ',
        );
        return;
      }

      try {
        await flagPostViolationMutation.mutateAsync({
          postId: moderationTarget.post.id,
          reason: parsed.data.reason,
        });
        setModerationTarget(null);
        setModerationReason('');
        setModerationError(null);
        toast.success('Đã đánh dấu vi phạm bài viết và gửi thông báo realtime.');
      } catch (err) {
        toast.error(
          isApiError(err)
            ? err.message
            : 'Không thể đánh dấu vi phạm bài viết lúc này.',
        );
      }
      return;
    }

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
        if (detailPostId === targetPostId) handleClosePostDetail();
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

  const handleRestorePost = async (post: Post) => {
    if (restorePostMutation.isPending) return;
    setRestoringPostId(post.id);
    try {
      await restorePostMutation.mutateAsync(post.id);
      toast.success('Đã khôi phục hiển thị bài viết.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể khôi phục bài viết lúc này.',
      );
    } finally {
      setRestoringPostId(null);
    }
  };

  const handleLoadMoreDetailComments = useCallback(() => {
    if (
      detailCommentsQuery.hasNextPage &&
      !detailCommentsQuery.isFetchingNextPage
    ) {
      void detailCommentsQuery.fetchNextPage();
    }
  }, [detailCommentsQuery]);

  const handleRetryDetail = () => {
    void detailPostQuery.refetch();
  };

  const handleRetryDetailComments = () => {
    void detailCommentsQuery.refetch();
  };

  const handleRequestRestoreAppeal = (post: Post, appeal: PostAppealSummary) => {
    setRestoreAppealTarget({ post, appeal });
  };

  const handleCancelRestoreAppeal = () => {
    if (restoreAppealMutation.isPending) return;
    setRestoreAppealTarget(null);
  };

  const handleConfirmRestoreAppeal = async () => {
    if (!restoreAppealTarget || restoreAppealMutation.isPending) return;
    try {
      await restoreAppealMutation.mutateAsync(restoreAppealTarget.appeal.id);
      setRestoreAppealTarget(null);
      toast.success('Đã khôi phục bài viết và gửi thông báo tới thành viên.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể khôi phục bài viết từ khiếu nại lúc này.',
      );
    }
  };

  const handleOpenEvidenceModal = (post: Post, appeal: PostAppealSummary) => {
    setEvidenceAppealTarget({ post, appeal });
    setEvidenceText('');
    setEvidenceError(null);
  };

  const handleCloseEvidenceModal = useCallback(() => {
    if (rejectAppealMutation.isPending) return;
    setEvidenceAppealTarget(null);
    setEvidenceText('');
    setEvidenceError(null);
  }, [rejectAppealMutation.isPending]);

  const handleEvidenceTextChange = (value: string) => {
    setEvidenceText(value);
    if (evidenceError) setEvidenceError(null);
  };

  const handleConfirmRejectAppeal = async (event: FormEvent) => {
    event.preventDefault();
    if (!evidenceAppealTarget || rejectAppealMutation.isPending) return;

    const parsed = rejectPostAppealSchema.safeParse({ evidence: evidenceText });
    if (!parsed.success) {
      setEvidenceError(
        parsed.error.issues[0]?.message ?? 'Minh chứng chưa hợp lệ',
      );
      return;
    }

    try {
      await rejectAppealMutation.mutateAsync({
        appealId: evidenceAppealTarget.appeal.id,
        evidence: parsed.data.evidence,
      });
      setEvidenceAppealTarget(null);
      setEvidenceText('');
      setEvidenceError(null);
      toast.success('Đã gửi minh chứng phản hồi khiếu nại tới thành viên.');
    } catch (err) {
      setEvidenceError(
        isApiError(err) ? err.message : 'Không thể gửi minh chứng lúc này.',
      );
    }
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
    detailPostId,
    detailAppealsExpanded,
    detailPost: detailPostQuery.data ?? null,
    isDetailPostLoading: detailPostQuery.isLoading,
    isDetailPostError: detailPostQuery.isError && !isDetailPostNotFound,
    isDetailPostNotFound,
    detailComments,
    totalDetailRootComments,
    isDetailCommentsLoading: detailCommentsQuery.isLoading,
    isDetailCommentsError: detailCommentsQuery.isError,
    hasNextDetailCommentsPage: Boolean(detailCommentsQuery.hasNextPage),
    isFetchingNextDetailComments: detailCommentsQuery.isFetchingNextPage,
    isFetchNextDetailCommentsError: detailCommentsQuery.isFetchNextPageError,
    restoringPostId,
    restoreAppealTarget,
    isRestoringAppeal: restoreAppealMutation.isPending,
    evidenceAppealTarget,
    evidenceText,
    evidenceError,
    isRejectingAppeal: rejectAppealMutation.isPending,
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
    violationDetailTarget,
    isClearingViolation: Boolean(violationClearingKind),
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
    handleClearAvatarViolation,
    handleClearCoverViolation,
    handleUnflagPostViolation,
    handleOpenViolationDetail,
    handleCloseViolationDetail,
    handleOpenHidePostModal,
    handleOpenRemovePostModal,
    handleOpenRemoveCommentModal,
    handleCloseModerationModal,
    handleModerationReasonChange,
    handleSelectModerationReasonPreset,
    handleConfirmModeration,
    handleRestorePost,
    handleOpenPostDetail,
    handleClosePostDetail,
    handleToggleDetailAppealsExpanded,
    handleRetryDetail,
    handleRetryDetailComments,
    handleLoadMoreDetailComments,
    handleRequestRestoreAppeal,
    handleCancelRestoreAppeal,
    handleConfirmRestoreAppeal,
    handleOpenEvidenceModal,
    handleCloseEvidenceModal,
    handleEvidenceTextChange,
    handleConfirmRejectAppeal,
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
