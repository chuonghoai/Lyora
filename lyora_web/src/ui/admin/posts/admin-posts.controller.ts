import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isApiError, toast, useDebounce } from '@/core';
import {
  createPostSchema,
  hidePostModerationSchema,
  postKeys,
  rejectPostAppealSchema,
  removeModerationReasonSchema,
  suggestPostContentSchema,
  useAdminPostAppealsQuery,
  useAdminPostDetailQuery,
  useAdminPostsQuery,
  useAdminPostStatisticsQuery,
  useCreatePostMutation,
  useHideAdminPostMutation,
  useInfiniteAdminPostAppealsHistoryQuery,
  useRejectAdminPostAppealMutation,
  useRemoveAdminCommentMutation,
  useRemoveAdminPostMutation,
  useRestoreAdminPostAppealMutation,
  useRestoreAdminPostMutation,
  useSuggestPostContentMutation,
  useUploadPostMediaMutation,
  type AdminPostAppealItem,
  type AdminPostAppealStatusFilter,
  type AdminPostAuthorRoleFilter,
  type AdminPostComment,
  type AdminPostItem,
  type AdminPostMediaFilter,
  type AdminPostsQueryParams,
  type AdminPostStatusFilter,
  type AdminPostVisibilityFilter,
  type PostContentSuggestion,
  type PostMediaItem,
  type PostSuggestionTone,
  type SuggestPostMediaContextItem,
} from '@/features/posts';
import { useQueryClient } from '@tanstack/react-query';

export type AdminPostsMainTab = 'posts' | 'appeals';

const ADMIN_POSTS_PAGE_SIZE = 10;
const MAX_COMPOSER_MEDIA = 8;
const MAX_AI_INLINE_MEDIA_BYTES = 18 * 1024 * 1024;

export type ModerationModalMode = 'HIDE_POST' | 'REMOVE_POST' | null;

export interface RemoveCommentDialogState {
  postId: string;
  comment: AdminPostComment;
}

export interface AdminMediaLightboxState {
  items: PostMediaItem[];
  index: number;
}

export function useAdminPostsController() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeMainTab: AdminPostsMainTab =
    searchParams.get('tab') === 'appeals' ? 'appeals' : 'posts';

  // Filter & Pagination States (Posts)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [statusFilter, setStatusFilter] = useState<AdminPostStatusFilter>('ALL');
  const [visibilityFilter, setVisibilityFilter] =
    useState<AdminPostVisibilityFilter>('ALL');
  const [authorRoleFilter, setAuthorRoleFilter] =
    useState<AdminPostAuthorRoleFilter>('ALL');
  const [mediaFilter, setMediaFilter] = useState<AdminPostMediaFilter>('ALL');
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Filter & Pagination States (Appeals)
  const [appealStatusFilter, setAppealStatusFilter] =
    useState<AdminPostAppealStatusFilter>('ALL');
  const [appealSearchQuery, setAppealSearchQuery] = useState('');
  const debouncedAppealSearch = useDebounce(appealSearchQuery, 350);
  const [appealPage, setAppealPage] = useState(1);
  const [restoreAppealTarget, setRestoreAppealTarget] =
    useState<AdminPostAppealItem | null>(null);
  const [evidenceModalTarget, setEvidenceModalTarget] =
    useState<AdminPostAppealItem | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [appealHistoryTarget, setAppealHistoryTarget] =
    useState<AdminPostAppealItem | null>(null);

  useEffect(() => {
    setAppealPage(1);
  }, [appealStatusFilter, debouncedAppealSearch]);

  // Reset về trang 1 khi thay đổi điều kiện lọc/tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    statusFilter,
    visibilityFilter,
    authorRoleFilter,
    mediaFilter,
  ]);

  const queryParams = useMemo<AdminPostsQueryParams>(() => {
    const hasMedia =
      mediaFilter === 'WITH_MEDIA'
        ? 'true'
        : mediaFilter === 'TEXT_ONLY'
          ? 'false'
          : undefined;

    return {
      page,
      limit: ADMIN_POSTS_PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
      authorRole: authorRoleFilter === 'ALL' ? undefined : authorRoleFilter,
      hasMedia,
    };
  }, [
    page,
    debouncedSearch,
    statusFilter,
    visibilityFilter,
    authorRoleFilter,
    mediaFilter,
  ]);

  // Queries & Mutations
  const statsQuery = useAdminPostStatisticsQuery();
  const postsQuery = useAdminPostsQuery(queryParams);
  const appealsQuery = useAdminPostAppealsQuery(
    {
      page: appealPage,
      limit: ADMIN_POSTS_PAGE_SIZE,
      status: appealStatusFilter,
      search: debouncedAppealSearch.trim() || undefined,
    },
    { enabled: activeMainTab === 'appeals' },
  );

  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState<AdminMediaLightboxState | null>(null);
  const detailQuery = useAdminPostDetailQuery(detailPostId);
  const appealHistoryQuery = useInfiniteAdminPostAppealsHistoryQuery(
    appealHistoryTarget?.postId ?? null,
    10,
  );

  const hidePostMutation = useHideAdminPostMutation();
  const restorePostMutation = useRestoreAdminPostMutation();
  const removePostMutation = useRemoveAdminPostMutation();
  const removeCommentMutation = useRemoveAdminCommentMutation();
  const restoreAppealMutation = useRestoreAdminPostAppealMutation();
  const rejectAppealMutation = useRejectAdminPostAppealMutation();
  const uploadMediaMutation = useUploadPostMediaMutation();
  const createPostMutation = useCreatePostMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
    },
  });
  const suggestMutation = useSuggestPostContentMutation();

  // Moderation Modal States (Hide / Remove Post)
  const [moderationMode, setModerationMode] =
    useState<ModerationModalMode>(null);
  const [lastModerationMode, setLastModerationMode] =
    useState<'HIDE_POST' | 'REMOVE_POST'>('HIDE_POST');
  const [moderationTargetPost, setModerationTargetPost] =
    useState<AdminPostItem | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [restoringPostId, setRestoringPostId] = useState<string | null>(null);

  // Comment Moderation State inside Detail Modal
  const [removeCommentTarget, setRemoveCommentTarget] =
    useState<RemoveCommentDialogState | null>(null);
  const [removeCommentReason, setRemoveCommentReason] = useState('');
  const [removeCommentError, setRemoveCommentError] = useState<string | null>(
    null,
  );
  const lastCommentCompositionEndRef = useRef<number | null>(null);
  const lastAiCompositionEndRef = useRef<number | null>(null);

  // Admin Official Post Composer Modal + AI Assistant States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerMedia, setComposerMedia] = useState<PostMediaItem[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const composerFilesRef = useRef<Map<string, File>>(new Map());

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<PostSuggestionTone>('PROFESSIONAL');
  const [aiSuggestions, setAiSuggestions] = useState<PostContentSuggestion[]>(
    [],
  );
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreviousContent, setAiPreviousContent] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const filesMap = composerFilesRef.current;
    return () => {
      filesMap.clear();
    };
  }, []);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'ALL' ||
    visibilityFilter !== 'ALL' ||
    authorRoleFilter !== 'ALL' ||
    mediaFilter !== 'ALL';

  // Filter & Pagination Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectStatusFilter = (status: AdminPostStatusFilter) => {
    setStatusFilter(status);
  };

  const handleSelectVisibilityFilter = (
    visibility: AdminPostVisibilityFilter,
  ) => {
    setVisibilityFilter(visibility);
  };

  const handleSelectAuthorRoleFilter = (role: AdminPostAuthorRoleFilter) => {
    setAuthorRoleFilter(role);
  };

  const handleSelectMediaFilter = (media: AdminPostMediaFilter) => {
    setMediaFilter(media);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
    setAuthorRoleFilter('ALL');
    setMediaFilter('ALL');
    setPage(1);
  };

  const handleChangePage = (nextPage: number) => {
    const totalPages = postsQuery.data?.meta.totalPages ?? 1;
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const handleSelectMainTab = (tab: AdminPostsMainTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'appeals') next.set('tab', 'appeals');
        else next.delete('tab');
        return next;
      },
      { replace: false },
    );
  };

  const handleAppealStatusFilterChange = (status: AdminPostAppealStatusFilter) => {
    setAppealStatusFilter(status);
  };

  const handleAppealSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppealSearchQuery(e.target.value);
  };

  const handleClearAppealSearch = () => {
    setAppealSearchQuery('');
  };

  const handleAppealPageChange = (nextPage: number) => {
    const totalPages = appealsQuery.data?.meta.totalPages ?? 1;
    if (nextPage < 1 || nextPage > totalPages) return;
    setAppealPage(nextPage);
  };

  const handleRetryAppeals = () => {
    void appealsQuery.refetch();
  };

  const handleRequestRestoreAppeal = (appeal: AdminPostAppealItem) => {
    setRestoreAppealTarget(appeal);
  };

  const handleCancelRestoreAppeal = () => {
    if (restoreAppealMutation.isPending) return;
    setRestoreAppealTarget(null);
  };

  const handleConfirmRestoreAppeal = async () => {
    if (!restoreAppealTarget || restoreAppealMutation.isPending) return;
    try {
      await restoreAppealMutation.mutateAsync(restoreAppealTarget.id);
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

  const handleOpenEvidenceModal = (appeal: AdminPostAppealItem) => {
    setEvidenceModalTarget(appeal);
    setEvidenceText('');
    setEvidenceError(null);
  };

  const handleOpenAppealHistoryModal = (appeal: AdminPostAppealItem) => {
    setAppealHistoryTarget(appeal);
  };

  const handleCloseAppealHistoryModal = useCallback(() => {
    setAppealHistoryTarget(null);
  }, []);

  const handleRetryAppealHistory = () => {
    void appealHistoryQuery.refetch();
  };

  const handleLoadMoreAppealHistory = useCallback(() => {
    if (
      appealHistoryQuery.hasNextPage &&
      !appealHistoryQuery.isFetchingNextPage
    ) {
      void appealHistoryQuery.fetchNextPage();
    }
  }, [appealHistoryQuery]);

  const handleCloseEvidenceModal = useCallback(() => {
    if (rejectAppealMutation.isPending) return;
    setEvidenceModalTarget(null);
    setEvidenceText('');
    setEvidenceError(null);
  }, [rejectAppealMutation.isPending]);

  const handleEvidenceTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEvidenceText(e.target.value);
    if (evidenceError) setEvidenceError(null);
  };

  const handleConfirmRejectAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalTarget || rejectAppealMutation.isPending) return;

    const parsed = rejectPostAppealSchema.safeParse({ evidence: evidenceText });
    if (!parsed.success) {
      setEvidenceError(
        parsed.error.issues[0]?.message ?? 'Minh chứng chưa hợp lệ',
      );
      return;
    }

    try {
      await rejectAppealMutation.mutateAsync({
        appealId: evidenceModalTarget.id,
        evidence: parsed.data.evidence,
      });
      setEvidenceModalTarget(null);
      setEvidenceText('');
      setEvidenceError(null);
      toast.success('Đã gửi minh chứng phản hồi khiếu nại tới thành viên.');
    } catch (err) {
      setEvidenceError(
        isApiError(err)
          ? err.message
          : 'Không thể gửi minh chứng lúc này.',
      );
    }
  };

  const handleRefreshAll = async () => {
    setIsManualRefreshing(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        statsQuery.refetch(),
        postsQuery.refetch(),
      ]);
      if (activeMainTab === 'appeals') {
        await appealsQuery.refetch();
      }
      if (detailPostId) {
        await detailQuery.refetch();
      }
      if (statsRes.isError || listRes.isError) {
        toast.error('Không thể làm mới đầy đủ dữ liệu bài viết.');
        return;
      }
      toast.success('Đã cập nhật dữ liệu bài viết mới nhất.');
    } catch {
      toast.error('Không thể làm mới dữ liệu lúc này.');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleRetryLoad = () => {
    void statsQuery.refetch();
    void postsQuery.refetch();
  };

  // Detail Modal Handlers
  const handleOpenDetail = (postId: string) => {
    setRemoveCommentTarget(null);
    setRemoveCommentReason('');
    setRemoveCommentError(null);
    setDetailPostId(postId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = useCallback(() => {
    setRemoveCommentTarget(null);
    setRemoveCommentReason('');
    setRemoveCommentError(null);
    setLightbox(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleOpenLightbox = useCallback(
    (items: PostMediaItem[], index: number) => {
      if (items.length === 0) return;
      const safeIndex = Math.max(0, Math.min(index, items.length - 1));
      setLightbox({ items, index: safeIndex });
    },
    [],
  );

  const handleCloseLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  const handlePrevLightbox = useCallback(() => {
    setLightbox((prev) => {
      if (!prev || prev.items.length <= 1) return prev;
      return {
        ...prev,
        index: (prev.index - 1 + prev.items.length) % prev.items.length,
      };
    });
  }, []);

  const handleNextLightbox = useCallback(() => {
    setLightbox((prev) => {
      if (!prev || prev.items.length <= 1) return prev;
      return {
        ...prev,
        index: (prev.index + 1) % prev.items.length,
      };
    });
  }, []);

  const handleRetryDetail = () => {
    void detailQuery.refetch();
  };

  // Hide / Restore / Remove Post Handlers
  const handleOpenHideModal = (post: AdminPostItem) => {
    setModerationTargetPost(post);
    setLastModerationMode('HIDE_POST');
    setModerationMode('HIDE_POST');
    setModerationReason(post.moderationReason ?? '');
    setModerationError(null);
  };

  const handleOpenRemoveModal = (post: AdminPostItem) => {
    setModerationTargetPost(post);
    setLastModerationMode('REMOVE_POST');
    setModerationMode('REMOVE_POST');
    setModerationReason('');
    setModerationError(null);
  };

  const handleCloseModerationModal = useCallback(() => {
    if (hidePostMutation.isPending || removePostMutation.isPending) return;
    setModerationMode(null);
    setModerationError(null);
  }, [hidePostMutation.isPending, removePostMutation.isPending]);

  const handleModerationReasonChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setModerationReason(e.target.value);
    if (moderationError) setModerationError(null);
  };

  const handleSelectReasonPreset = (preset: string) => {
    setModerationReason(preset);
    if (moderationError) setModerationError(null);
  };

  const handleConfirmModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderationTargetPost || !moderationMode) return;

    if (moderationMode === 'HIDE_POST') {
      const parsed = hidePostModerationSchema.safeParse({
        reason: moderationReason,
      });
      if (!parsed.success) {
        setModerationError(
          parsed.error.issues[0]?.message ?? 'Lý do ẩn bài viết chưa hợp lệ',
        );
        return;
      }

      try {
        await hidePostMutation.mutateAsync({
          postId: moderationTargetPost.id,
          reason: parsed.data.reason,
        });
        toast.success('Đã ẩn bài viết vi phạm và gửi thông báo cho tác giả.');
        setModerationMode(null);
        setModerationReason('');
        setModerationError(null);
      } catch (err) {
        const msg = isApiError(err)
          ? err.message
          : 'Không thể ẩn bài viết lúc này.';
        setModerationError(msg);
      }
      return;
    }

    const parsedRemove = removeModerationReasonSchema.safeParse({
      reason: moderationReason,
    });
    if (!parsedRemove.success) {
      setModerationError(
        parsedRemove.error.issues[0]?.message ?? 'Lý do gỡ bỏ chưa hợp lệ',
      );
      return;
    }

    try {
      const targetId = moderationTargetPost.id;
      await removePostMutation.mutateAsync({
        postId: targetId,
        reason: parsedRemove.data.reason?.trim() || undefined,
      });
      if (detailPostId === targetId) {
        setIsDetailModalOpen(false);
        setDetailPostId(null);
      }
      toast.success('Đã gỡ bỏ bài viết khỏi hệ thống.');
      setModerationMode(null);
      setModerationReason('');
      setModerationError(null);
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : 'Không thể gỡ bỏ bài viết lúc này.';
      setModerationError(msg);
    }
  };

  const handleRestorePost = async (post: AdminPostItem) => {
    if (restoringPostId) return;
    setRestoringPostId(post.id);
    try {
      await restorePostMutation.mutateAsync(post.id);
      toast.success('Đã khôi phục hiển thị bài viết.');
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : 'Không thể khôi phục bài viết lúc này.';
      toast.error(msg);
    } finally {
      setRestoringPostId(null);
    }
  };

  // Comment Moderation Handlers
  const handlePromptRemoveComment = (
    postId: string,
    comment: AdminPostComment,
  ) => {
    setRemoveCommentTarget({ postId, comment });
    setRemoveCommentReason('');
    setRemoveCommentError(null);
  };

  const handleCancelRemoveComment = () => {
    if (removeCommentMutation.isPending) return;
    setRemoveCommentTarget(null);
    setRemoveCommentReason('');
    setRemoveCommentError(null);
  };

  const handleRemoveCommentReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRemoveCommentReason(e.target.value);
    if (removeCommentError) setRemoveCommentError(null);
  };

  const handleRemoveCommentCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>,
  ) => {
    lastCommentCompositionEndRef.current = e.nativeEvent.timeStamp;
  };

  const handleConfirmRemoveComment = async () => {
    if (!removeCommentTarget) return;
    const parsed = removeModerationReasonSchema.safeParse({
      reason: removeCommentReason,
    });
    if (!parsed.success) {
      setRemoveCommentError(
        parsed.error.issues[0]?.message ?? 'Lý do gỡ bình luận chưa hợp lệ',
      );
      return;
    }

    try {
      await removeCommentMutation.mutateAsync({
        postId: removeCommentTarget.postId,
        commentId: removeCommentTarget.comment.id,
        reason: parsed.data.reason?.trim() || undefined,
      });
      toast.success('Đã gỡ bình luận vi phạm.');
      setRemoveCommentTarget(null);
      setRemoveCommentReason('');
      setRemoveCommentError(null);
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : 'Không thể gỡ bình luận lúc này.';
      setRemoveCommentError(msg);
    }
  };

  const handleRemoveCommentReasonKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) {
        return;
      }
      if (
        lastCommentCompositionEndRef.current !== null &&
        Math.abs(
          e.nativeEvent.timeStamp - lastCommentCompositionEndRef.current,
        ) < 50
      ) {
        return;
      }
      if (!removeCommentMutation.isPending) {
        void handleConfirmRemoveComment();
      }
    }
  };

  // Admin Official Post Composer & AI Assistant Handlers
  const resetComposerState = useCallback(() => {
    composerMedia.forEach((item) => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    composerFilesRef.current.clear();
    setComposerContent('');
    setComposerMedia([]);
    setComposerError(null);
    setIsAiPanelOpen(false);
    setAiTopic('');
    setAiTone('PROFESSIONAL');
    setAiSuggestions([]);
    setAiError(null);
    setAiPreviousContent(null);
    suggestMutation.reset();
  }, [composerMedia, suggestMutation]);

  const handleOpenCreateModal = () => {
    setComposerError(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = useCallback(() => {
    if (createPostMutation.isPending || uploadMediaMutation.isPending) return;
    resetComposerState();
    setIsCreateModalOpen(false);
  }, [
    createPostMutation.isPending,
    uploadMediaMutation.isPending,
    resetComposerState,
  ]);

  const handleComposerContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setComposerContent(e.target.value);
    setAiPreviousContent(null);
    if (composerError) setComposerError(null);
  };

  const handlePickComposerMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (fileList.length === 0) return;

    const validFiles = fileList.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
    );
    if (validFiles.length === 0) {
      toast.warning('Chỉ hỗ trợ đính kèm tệp hình ảnh hoặc video.');
      return;
    }

    const remainingSlots = MAX_COMPOSER_MEDIA - composerMedia.length;
    if (remainingSlots <= 0) {
      toast.warning(`Tối đa ${MAX_COMPOSER_MEDIA} phương tiện cho mỗi bài viết.`);
      return;
    }

    const accepted = validFiles.slice(0, remainingSlots);
    const nextItems: PostMediaItem[] = accepted.map((file) => {
      const localId = `admin-media-${crypto.randomUUID()}`;
      composerFilesRef.current.set(localId, file);
      return {
        id: localId,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        fileName: file.name,
        size: file.size,
      };
    });

    setComposerMedia((prev) => [...prev, ...nextItems]);
    if (composerError) setComposerError(null);
  };

  const handleRemoveComposerMedia = (index: number) => {
    setComposerMedia((prev) => {
      const target = prev[index];
      if (target) {
        if (target.url.startsWith('blob:')) {
          URL.revokeObjectURL(target.url);
        }
        if (target.id) {
          composerFilesRef.current.delete(target.id);
        }
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleToggleAiPanel = () => {
    setIsAiPanelOpen((prev) => !prev);
    setAiError(null);
  };

  const handleAiTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiTopic(e.target.value);
    if (aiError) setAiError(null);
  };

  const handleAiTopicCompositionEnd = (
    e: React.CompositionEvent<HTMLTextAreaElement>,
  ) => {
    lastAiCompositionEndRef.current = e.nativeEvent.timeStamp;
  };

  const handleAiToneChange = (tone: PostSuggestionTone) => {
    setAiTone(tone);
    if (aiError) setAiError(null);
  };

  const handleRequestAiSuggestions = async () => {
    const rawFiles = composerMedia
      .map((item) => (item.id ? composerFilesRef.current.get(item.id) : undefined))
      .filter((f): f is File => Boolean(f));

    const selectedFiles: File[] = [];
    let totalBytes = 0;
    for (const file of rawFiles) {
      if (totalBytes + file.size <= MAX_AI_INLINE_MEDIA_BYTES) {
        totalBytes += file.size;
        selectedFiles.push(file);
      }
    }

    const mediaItems: SuggestPostMediaContextItem[] = composerMedia.map(
      (item) => ({
        type: item.type,
        ...(item.fileName?.trim() ? { fileName: item.fileName.trim() } : {}),
      }),
    );

    const parsed = suggestPostContentSchema.safeParse({
      topic: aiTopic,
      currentContent: composerContent,
      tone: aiTone,
      visibility: 'PUBLIC',
      ...(mediaItems.length > 0 ? { mediaItems } : {}),
      ...(selectedFiles.length > 0 ? { mediaFiles: selectedFiles } : {}),
    });

    if (!parsed.success) {
      setAiError(
        parsed.error.issues[0]?.message ??
          'Vui lòng nhập ý chính hoặc nội dung dự thảo để AI gợi ý',
      );
      return;
    }

    setAiError(null);
    try {
      const result = await suggestMutation.mutateAsync({
        tone: parsed.data.tone,
        visibility: parsed.data.visibility,
        ...(parsed.data.topic ? { topic: parsed.data.topic } : {}),
        ...(parsed.data.currentContent
          ? { currentContent: parsed.data.currentContent }
          : {}),
        ...(mediaItems.length > 0 ? { mediaItems } : {}),
        ...(selectedFiles.length > 0 ? { mediaFiles: selectedFiles } : {}),
      });
      setAiSuggestions(result.suggestions);
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể tạo gợi ý lúc này, vui lòng thử lại.';
      setAiError(msg);
    }
  };

  const handleAiTopicKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) {
        return;
      }
      if (
        lastAiCompositionEndRef.current !== null &&
        Math.abs(e.nativeEvent.timeStamp - lastAiCompositionEndRef.current) < 50
      ) {
        return;
      }
      if (!suggestMutation.isPending) {
        void handleRequestAiSuggestions();
      }
    }
  };

  const handleApplyAiSuggestion = (suggestionId: string) => {
    const target = aiSuggestions.find((item) => item.id === suggestionId);
    if (!target) return;
    setAiPreviousContent((prev) => (prev === null ? composerContent : prev));
    setComposerContent(target.content);
    if (composerError) setComposerError(null);
  };

  const handleUndoAiApply = () => {
    if (aiPreviousContent === null) return;
    setComposerContent(aiPreviousContent);
    setAiPreviousContent(null);
  };

  const handleSubmitAdminPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = createPostSchema.safeParse({
      content: composerContent,
      visibility: 'PUBLIC',
      media: composerMedia,
    });

    if (!validation.success) {
      setComposerError(
        validation.error.issues[0]?.message ?? 'Nội dung bài viết chưa hợp lệ',
      );
      return;
    }

    try {
      const pendingFiles = composerMedia.map((item) =>
        item.id ? composerFilesRef.current.get(item.id) : undefined,
      );
      const filesToUpload = pendingFiles.filter((file): file is File =>
        Boolean(file),
      );
      const uploadedMedia =
        filesToUpload.length > 0
          ? await uploadMediaMutation.mutateAsync(filesToUpload)
          : [];

      if (uploadedMedia.length !== filesToUpload.length) {
        throw new Error('Tải phương tiện lên chưa hoàn tất, vui lòng thử lại.');
      }

      let cursor = 0;
      const finalMedia: PostMediaItem[] = validation.data.media.map(
        (item, idx) => {
          if (!pendingFiles[idx]) return item;
          return uploadedMedia[cursor++];
        },
      );

      await createPostMutation.mutateAsync({
        content: validation.data.content,
        visibility: validation.data.visibility,
        media: finalMedia,
      });

      resetComposerState();
      setIsCreateModalOpen(false);
      toast.success('Đã xuất bản bài viết từ Ban Quản Trị.');
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể đăng bài viết lúc này.';
      setComposerError(msg);
    }
  };

  const posts = postsQuery.data?.items ?? [];
  const paginationMeta = postsQuery.data?.meta ?? {
    page,
    limit: ADMIN_POSTS_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const appeals = appealsQuery.data?.items ?? [];
  const appealsPaginationMeta = appealsQuery.data?.meta ?? {
    page: appealPage,
    limit: ADMIN_POSTS_PAGE_SIZE,
    totalItems: appeals.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const appealHistoryItems = useMemo(
    () => appealHistoryQuery.data?.pages.flatMap((pageData) => pageData.items) ?? [],
    [appealHistoryQuery.data],
  );
  const appealHistoryTotalItems =
    appealHistoryQuery.data?.pages[0]?.meta.totalItems ??
    appealHistoryTarget?.totalAppealsCount ??
    appealHistoryItems.length;

  return {
    // Main Tab
    activeMainTab,

    // Statistics & List Data
    stats: statsQuery.data ?? null,
    isStatsLoading: statsQuery.isLoading,
    isStatsError: statsQuery.isError,
    posts,
    paginationMeta,
    isPostsLoading: postsQuery.isLoading,
    isPostsFetching: postsQuery.isFetching,
    isPostsError: postsQuery.isError,
    isManualRefreshing,

    // Appeals Tab Data
    appeals,
    appealsPaginationMeta,
    isAppealsLoading: appealsQuery.isLoading,
    isAppealsFetching: appealsQuery.isFetching,
    isAppealsError: appealsQuery.isError,
    appealStatusFilter,
    appealSearchQuery,
    restoreAppealTarget,
    isRestoringAppeal: restoreAppealMutation.isPending,
    evidenceModalTarget,
    evidenceText,
    evidenceError,
    isRejectingAppeal: rejectAppealMutation.isPending,
    appealHistoryTarget,
    appealHistoryItems,
    appealHistoryTotalItems,
    isAppealHistoryLoading: appealHistoryQuery.isLoading,
    isAppealHistoryError: appealHistoryQuery.isError,
    hasNextAppealHistoryPage: Boolean(appealHistoryQuery.hasNextPage),
    isFetchingNextAppealHistory: appealHistoryQuery.isFetchingNextPage,
    isFetchNextAppealHistoryError: appealHistoryQuery.isFetchNextPageError,

    // Filters
    searchQuery,
    debouncedSearch,
    statusFilter,
    visibilityFilter,
    authorRoleFilter,
    mediaFilter,
    hasActiveFilters,

    // Detail Modal & Media Lightbox
    isDetailModalOpen,
    detailPostId,
    detailPost: detailQuery.data ?? null,
    isDetailLoading: detailQuery.isLoading,
    isDetailError: detailQuery.isError,
    lightbox,

    // Moderation Modal & Row States
    moderationMode,
    lastModerationMode,
    moderationTargetPost,
    moderationReason,
    moderationError,
    isModeratingPost:
      hidePostMutation.isPending || removePostMutation.isPending,
    restoringPostId,

    // Comment Moderation States
    removeCommentTarget,
    removeCommentReason,
    removeCommentError,
    isRemovingComment: removeCommentMutation.isPending,

    // Create Official Post Modal & AI Assistant States
    isCreateModalOpen,
    isComposerDirty:
      composerContent.trim().length > 0 || composerMedia.length > 0,
    composerContent,
    composerMedia,
    composerError,
    isPublishingPost:
      createPostMutation.isPending || uploadMediaMutation.isPending,
    isAiPanelOpen,
    aiTopic,
    aiTone,
    aiSuggestions,
    isGeneratingAi: suggestMutation.isPending,
    aiError,
    canUndoAiApply: aiPreviousContent !== null,

    // Handlers
    handleSelectMainTab,
    handleSearchChange,
    handleClearSearch,
    handleSelectStatusFilter,
    handleSelectVisibilityFilter,
    handleSelectAuthorRoleFilter,
    handleSelectMediaFilter,
    handleResetFilters,
    handleChangePage,
    handleAppealStatusFilterChange,
    handleAppealSearchChange,
    handleClearAppealSearch,
    handleAppealPageChange,
    handleRetryAppeals,
    handleRequestRestoreAppeal,
    handleCancelRestoreAppeal,
    handleConfirmRestoreAppeal,
    handleOpenEvidenceModal,
    handleCloseEvidenceModal,
    handleEvidenceTextChange,
    handleConfirmRejectAppeal,
    handleOpenAppealHistoryModal,
    handleCloseAppealHistoryModal,
    handleRetryAppealHistory,
    handleLoadMoreAppealHistory,
    handleRefreshAll,
    handleRetryLoad,
    handleOpenDetail,
    handleCloseDetail,
    handleRetryDetail,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevLightbox,
    handleNextLightbox,
    handleOpenHideModal,
    handleOpenRemoveModal,
    handleCloseModerationModal,
    handleModerationReasonChange,
    handleSelectReasonPreset,
    handleConfirmModeration,
    handleRestorePost,
    handlePromptRemoveComment,
    handleCancelRemoveComment,
    handleRemoveCommentReasonChange,
    handleRemoveCommentCompositionEnd,
    handleRemoveCommentReasonKeyDown,
    handleConfirmRemoveComment,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleComposerContentChange,
    handlePickComposerMedia,
    handleRemoveComposerMedia,
    handleToggleAiPanel,
    handleAiTopicChange,
    handleAiTopicCompositionEnd,
    handleAiTopicKeyDown,
    handleAiToneChange,
    handleRequestAiSuggestions,
    handleApplyAiSuggestion,
    handleUndoAiApply,
    handleSubmitAdminPost,
  };
}

export type AdminPostsController = ReturnType<typeof useAdminPostsController>;
