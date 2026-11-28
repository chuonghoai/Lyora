import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore } from '@/core';
import { useCreateDirectConversationMutation } from '@/features/conversations';
import { useAcceptedFriendsQuery } from '@/features/friends';
import {
  createCommentSchema,
  useCreateCommentMutation,
  useInfinitePostsQuery,
  usePostDetailQuery,
  usePostReactionsQuery,
  useReactPostMutation,
  useSharePostMutation,
  useUploadPostMediaMutation,
  type Post,
  type PostMediaItem,
  type ReactionType,
} from '@/features/posts';
import { getClientProfilePath, ROUTES } from '@/routes/paths';
import type {
  FriendContactItem,
  MediaLightboxState,
  ReactionsPopoverState,
} from '../home/post-feed.controller';

export type VideoScopeFilter = 'ALL' | 'FRIENDS' | 'MINE';
export type VideoSlideDirection = 'next' | 'prev' | 'none';

export function extractPostVideos(post: Post): PostMediaItem[] {
  return (post.media ?? []).filter((item) => item.type === 'VIDEO');
}

export function extractPostAuxiliaryMedia(post: Post): {
  images: PostMediaItem[];
  audios: PostMediaItem[];
} {
  const media = post.media ?? [];
  return {
    images: media.filter((item) => item.type === 'IMAGE'),
    audios: media.filter((item) => item.type === 'AUDIO'),
  };
}

export function getNextClipIndex(
  currentIndex: number,
  totalClips: number,
  direction: 'prev' | 'next',
): number {
  if (totalClips <= 1) return 0;
  const safeCurrent = Math.max(0, Math.min(currentIndex, totalClips - 1));
  if (direction === 'prev') {
    return (safeCurrent - 1 + totalClips) % totalClips;
  }
  return (safeCurrent + 1) % totalClips;
}

export function formatVideoDuration(totalSeconds?: number): string | null {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null;
  }
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function mergeFocusedVideoPost(
  feedPosts: Post[],
  focusedPost: Post | null | undefined,
): Post[] {
  const videoFeed = feedPosts.filter((post) => extractPostVideos(post).length > 0);
  if (!focusedPost || extractPostVideos(focusedPost).length === 0) {
    return videoFeed;
  }
  if (videoFeed.some((post) => post.id === focusedPost.id)) {
    return videoFeed;
  }
  return [focusedPost, ...videoFeed];
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function useVideosController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const requestedPostId = searchParams.get('post')?.trim() || null;

  const [scopeFilter, setScopeFilter] = useState<VideoScopeFilter>('ALL');
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<VideoSlideDirection>('none');
  const [clipIndexByPost, setClipIndexByPost] = useState<Record<string, number>>({});

  // Comment & modal states
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentMediaDrafts, setCommentMediaDrafts] = useState<
    Record<string, PostMediaItem | null>
  >({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [mobileCommentsOpenMap, setMobileCommentsOpenMap] = useState<Record<string, boolean>>({});
  const [reactionsPopover, setReactionsPopover] = useState<ReactionsPopoverState | null>(null);
  const [lightbox, setLightbox] = useState<MediaLightboxState | null>(null);

  const commentPendingFilesRef = useRef<Map<string, File>>(new Map());
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const wheelLockUntilRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartIsolatedRef = useRef<boolean>(false);
  const pendingAdvanceAfterFetchRef = useRef<boolean>(false);

  const queryParams = useMemo(() => {
    if (scopeFilter === 'MINE') {
      return { filter: 'mine' as const, visibility: undefined, mediaType: 'VIDEO' as const, limit: 6 };
    }
    if (scopeFilter === 'FRIENDS') {
      return { filter: 'all' as const, visibility: 'FRIENDS' as const, mediaType: 'VIDEO' as const, limit: 6 };
    }
    return { filter: 'all' as const, visibility: undefined, mediaType: 'VIDEO' as const, limit: 6 };
  }, [scopeFilter]);

  const videosQuery = useInfinitePostsQuery(queryParams);
  const focusedPostQuery = usePostDetailQuery(requestedPostId);
  const acceptedFriendsQuery = useAcceptedFriendsQuery();
  const createDirectConversationMutation = useCreateDirectConversationMutation();

  const reactPostMutation = useReactPostMutation();
  const sharePostMutation = useSharePostMutation();
  const createCommentMutation = useCreateCommentMutation();
  const uploadMediaMutation = useUploadPostMediaMutation();

  const reactionsQuery = usePostReactionsQuery(reactionsPopover?.postId ?? null, {
    page: reactionsPopover?.page ?? 1,
    limit: 10,
    reactionType: reactionsPopover?.reactionType,
  });

  const rawFeedPosts = useMemo(
    () => videosQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [videosQuery.data],
  );

  const posts = useMemo(
    () => mergeFocusedVideoPost(rawFeedPosts, focusedPostQuery.data),
    [rawFeedPosts, focusedPostQuery.data],
  );

  const friends = useMemo<FriendContactItem[]>(
    () =>
      (acceptedFriendsQuery.data ?? []).map((friend) => ({
        id: friend.id,
        fullName: friend.fullName,
        avatarUrl: friend.avatarUrl,
        isOnline: friend.isOnline ?? false,
      })),
    [acceptedFriendsQuery.data],
  );

  const resolvedActivePostId = useMemo(() => {
    if (activePostId && posts.some((post) => post.id === activePostId)) {
      return activePostId;
    }
    if (requestedPostId && posts.some((post) => post.id === requestedPostId)) {
      return requestedPostId;
    }
    return posts[0]?.id ?? null;
  }, [activePostId, posts, requestedPostId]);

  const activePostIndex = useMemo(() => {
    if (!resolvedActivePostId) return 0;
    const found = posts.findIndex((post) => post.id === resolvedActivePostId);
    return found >= 0 ? found : 0;
  }, [posts, resolvedActivePostId]);

  const activePost = useMemo<Post | null>(
    () => posts[activePostIndex] ?? null,
    [posts, activePostIndex],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = videosQuery;

  const canScrollPrev = activePostIndex > 0;
  const canScrollNext = activePostIndex < posts.length - 1 || Boolean(hasNextPage);

  const totalItems = videosQuery.data?.pages[0]?.meta.totalItems ?? posts.length;

  const reactionsModalPost = useMemo<Post | null>(() => {
    if (!reactionsPopover) return null;
    return posts.find((post) => post.id === reactionsPopover.postId) ?? null;
  }, [reactionsPopover, posts]);

  const isDeepLinkUnavailable = Boolean(
    requestedPostId &&
      !focusedPostQuery.isLoading &&
      (focusedPostQuery.isError ||
        (focusedPostQuery.data && extractPostVideos(focusedPostQuery.data).length === 0)),
  );

  const registerPostCardElement = useCallback(
    (_postId: string, _element: HTMLElement | null) => {
      // Single-stage mode renders the active video post directly without scroll spying.
    },
    [],
  );

  // Prefetch next page when user nears the last 2 video posts
  useEffect(() => {
    if (
      posts.length > 0 &&
      activePostIndex >= posts.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [activePostIndex, posts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-advance once next page finishes loading if user triggered "next" at the end
  useEffect(() => {
    if (!pendingAdvanceAfterFetchRef.current || isFetchingNextPage) return;
    const nextPost = posts[activePostIndex + 1];
    if (nextPost) {
      pendingAdvanceAfterFetchRef.current = false;
      setSlideDirection('next');
      setActivePostId(nextPost.id);
    } else if (!hasNextPage) {
      pendingAdvanceAfterFetchRef.current = false;
    }
  }, [posts, activePostIndex, isFetchingNextPage, hasNextPage]);

  // Cleanup created blob URLs on unmount
  useEffect(() => {
    const blobUrls = createdBlobUrlsRef.current;
    const pendingFiles = commentPendingFilesRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
      pendingFiles.clear();
    };
  }, []);

  const handleSelectScopeFilter = (scope: VideoScopeFilter) => {
    setScopeFilter(scope);
    setSlideDirection('none');
    setActivePostId(null);
    if (requestedPostId) {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  };

  const handleClearDeepLink = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleRefreshVideos = async () => {
    const result = await videosQuery.refetch();
    if (result.isError) {
      toast.error('Không thể làm mới danh sách video. Vui lòng thử lại.');
      return;
    }
    toast.info('Đã làm mới danh sách video mới nhất.');
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const handleToggleAutoPlay = () => {
    setIsAutoPlayEnabled((prev) => {
      const next = !prev;
      toast.info(next ? 'Đã bật tự động phát khi cuộn.' : 'Đã tắt tự động phát khi cuộn.');
      return next;
    });
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleActivatePost = (postId: string) => {
    setActivePostId(postId);
  };

  const handleStepClip = useCallback(
    (postId: string, totalClips: number, direction: 'prev' | 'next') => {
      if (totalClips <= 1) return;
      setActivePostId(postId);
      setClipIndexByPost((prev) => ({
        ...prev,
        [postId]: getNextClipIndex(prev[postId] ?? 0, totalClips, direction),
      }));
    },
    [],
  );

  const handleSelectClip = (postId: string, clipIndex: number) => {
    setActivePostId(postId);
    setClipIndexByPost((prev) => ({
      ...prev,
      [postId]: Math.max(0, clipIndex),
    }));
  };

  const handleScrollToAdjacentPost = useCallback(
    (direction: 'prev' | 'next') => {
      if (posts.length === 0) return;

      if (direction === 'prev') {
        if (activePostIndex <= 0) return;
        const prevPost = posts[activePostIndex - 1];
        if (!prevPost) return;
        pendingAdvanceAfterFetchRef.current = false;
        setSlideDirection('prev');
        setActivePostId(prevPost.id);
        return;
      }

      if (activePostIndex < posts.length - 1) {
        const nextPost = posts[activePostIndex + 1];
        if (!nextPost) return;
        pendingAdvanceAfterFetchRef.current = false;
        setSlideDirection('next');
        setActivePostId(nextPost.id);
        return;
      }

      if (hasNextPage && !isFetchingNextPage) {
        pendingAdvanceAfterFetchRef.current = true;
        void fetchNextPage();
      }
    },
    [posts, activePostIndex, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const isInsideScrollableIsolatedRegion = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const isolated = target.closest<HTMLElement>('[data-video-scroll-isolated="true"]');
    if (!isolated) return false;
    return isolated.scrollHeight > isolated.clientHeight + 2;
  };

  const handleStageWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (reactionsPopover || lightbox) return;
      if (isInsideScrollableIsolatedRegion(event.target)) return;
      if (Math.abs(event.deltaY) < 28) return;

      const now = Date.now();
      if (now < wheelLockUntilRef.current) return;

      const direction: 'prev' | 'next' = event.deltaY > 0 ? 'next' : 'prev';
      if (direction === 'prev' && !canScrollPrev) return;
      if (direction === 'next' && !canScrollNext) return;

      wheelLockUntilRef.current = now + 460;
      handleScrollToAdjacentPost(direction);
    },
    [reactionsPopover, lightbox, canScrollPrev, canScrollNext, handleScrollToAdjacentPost],
  );

  const handleStageTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartIsolatedRef.current = isInsideScrollableIsolatedRegion(event.target);
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleStageTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const startY = touchStartYRef.current;
      touchStartYRef.current = null;
      if (startY === null || touchStartIsolatedRef.current || reactionsPopover || lightbox) {
        return;
      }
      const endY = event.changedTouches[0]?.clientY;
      if (typeof endY !== 'number') return;
      const deltaY = startY - endY;
      if (Math.abs(deltaY) < 56) return;

      const direction: 'prev' | 'next' = deltaY > 0 ? 'next' : 'prev';
      if (direction === 'prev' && !canScrollPrev) return;
      if (direction === 'next' && !canScrollNext) return;

      handleScrollToAdjacentPost(direction);
    },
    [reactionsPopover, lightbox, canScrollPrev, canScrollNext, handleScrollToAdjacentPost],
  );

  // Keyboard shortcuts for active multi-video post & lightbox/modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightbox) {
          setLightbox(null);
          return;
        }
        if (reactionsPopover) {
          setReactionsPopover(null);
          return;
        }
      }

      if (lightbox) {
        if (event.key === 'ArrowLeft') {
          setLightbox((prev) =>
            prev
              ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }
              : null,
          );
        } else if (event.key === 'ArrowRight') {
          setLightbox((prev) =>
            prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null,
          );
        }
        return;
      }

      if (reactionsPopover || isEditableElement(event.target)) {
        return;
      }

      if (event.key.toLowerCase() === 'm') {
        setIsMuted((prev) => !prev);
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        handleScrollToAdjacentPost(event.key === 'ArrowUp' ? 'prev' : 'next');
        return;
      }

      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && resolvedActivePostId) {
        const activePost = posts.find((post) => post.id === resolvedActivePostId);
        if (!activePost) return;
        const videos = extractPostVideos(activePost);
        if (videos.length > 1) {
          event.preventDefault();
          handleStepClip(
            activePost.id,
            videos.length,
            event.key === 'ArrowLeft' ? 'prev' : 'next',
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    lightbox,
    reactionsPopover,
    resolvedActivePostId,
    posts,
    handleStepClip,
    handleScrollToAdjacentPost,
  ]);

  // Post interactions
  const handleReactPost = async (postId: string, reactionType: ReactionType) => {
    try {
      await reactPostMutation.mutateAsync({ postId, reactionType });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể bày tỏ cảm xúc lúc này.';
      toast.error(message);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await sharePostMutation.mutateAsync(postId);
      const shareUrl = `${window.location.origin}${ROUTES.CLIENT.VIDEOS}?post=${encodeURIComponent(postId)}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
      }
      toast.success('Đã chia sẻ video và sao chép liên kết!');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể chia sẻ video lúc này.';
      toast.error(message);
    }
  };

  const handleCopyVideoLink = async (postId: string) => {
    const shareUrl = `${window.location.origin}${ROUTES.CLIENT.VIDEOS}?post=${encodeURIComponent(postId)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Đã sao chép liên kết bài đăng video.');
    } catch {
      toast.info('Không thể truy cập bộ nhớ tạm trên trình duyệt.');
    }
  };

  const handleOpenReactionsModal = (postId: string) => {
    setReactionsPopover({ postId, page: 1, reactionType: undefined });
  };

  const handleCloseReactionsModal = () => {
    setReactionsPopover(null);
  };

  const handleChangeReactionsFilter = (reactionType?: ReactionType) => {
    setReactionsPopover((prev) => (prev ? { ...prev, page: 1, reactionType } : null));
  };

  const handleChangeReactionsPage = (page: number) => {
    setReactionsPopover((prev) => (prev ? { ...prev, page } : null));
  };

  const handleRetryReactions = () => {
    void reactionsQuery.refetch();
  };

  // Comment handlers
  const handleCommentDraftChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
    if (commentErrors[postId]) {
      setCommentErrors((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  const handlePickCommentMedia = (
    postId: string,
    expectedType: 'IMAGE' | 'VIDEO',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if ((expectedType === 'IMAGE' && !isImage) || (expectedType === 'VIDEO' && !isVideo)) {
      toast.warning(
        expectedType === 'IMAGE'
          ? 'Vui lòng chọn tệp hình ảnh hợp lệ.'
          : 'Vui lòng chọn tệp video ngắn hợp lệ.',
      );
      return;
    }

    const previous = commentMediaDrafts[postId];
    if (previous?.url.startsWith('blob:')) {
      URL.revokeObjectURL(previous.url);
    }
    if (previous?.id) {
      commentPendingFilesRef.current.delete(previous.id);
    }

    const id = `video-comment-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    commentPendingFilesRef.current.set(id, file);
    const url = URL.createObjectURL(file);
    createdBlobUrlsRef.current.add(url);

    setCommentMediaDrafts((prev) => ({
      ...prev,
      [postId]: {
        id,
        url,
        type: expectedType,
        alt: file.name,
        fileName: file.name,
        size: file.size,
      },
    }));
    setCommentErrors((prev) => {
      if (!prev[postId]) return prev;
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  };

  const handleRemoveCommentMedia = (postId: string) => {
    const existing = commentMediaDrafts[postId];
    if (existing?.url.startsWith('blob:')) {
      URL.revokeObjectURL(existing.url);
    }
    if (existing?.id) {
      commentPendingFilesRef.current.delete(existing.id);
    }
    setCommentMediaDrafts((prev) => ({ ...prev, [postId]: null }));
  };

  const handleSubmitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const draft = commentDrafts[postId] ?? '';
    const mediaDraft = commentMediaDrafts[postId] ?? null;

    const validation = createCommentSchema.safeParse({
      content: draft,
      media: mediaDraft,
    });
    if (!validation.success) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]:
          validation.error.issues[0]?.message ??
          'Vui lòng nhập nội dung hoặc đính kèm ảnh/video',
      }));
      return;
    }

    try {
      let finalMedia = validation.data.media ?? null;
      if (mediaDraft?.id) {
        const pendingFile = commentPendingFilesRef.current.get(mediaDraft.id);
        if (pendingFile) {
          const uploaded = await uploadMediaMutation.mutateAsync([pendingFile]);
          if (!uploaded[0]) {
            throw new Error('Không thể tải tệp đính kèm bình luận.');
          }
          finalMedia = { ...uploaded[0], alt: mediaDraft.alt ?? uploaded[0].alt };
        }
      }

      await createCommentMutation.mutateAsync({
        postId,
        content: validation.data.content,
        media: finalMedia,
      });

      if (mediaDraft?.url.startsWith('blob:')) {
        URL.revokeObjectURL(mediaDraft.url);
      }
      if (mediaDraft?.id) {
        commentPendingFilesRef.current.delete(mediaDraft.id);
      }
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setCommentMediaDrafts((prev) => ({ ...prev, [postId]: null }));
      setMobileCommentsOpenMap((prev) => ({ ...prev, [postId]: true }));
      setCommentErrors((prev) => {
        if (!prev[postId]) return prev;
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể gửi bình luận lúc này.';
      toast.error(message);
    }
  };

  const handleToggleMobileComments = (postId: string) => {
    setMobileCommentsOpenMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleFocusCommentInput = (postId: string) => {
    setMobileCommentsOpenMap((prev) => ({ ...prev, [postId]: true }));
    window.setTimeout(() => {
      const input = document.getElementById(`video-comment-input-${postId}`);
      input?.focus();
    }, 40);
  };

  // Lightbox handlers
  const handleOpenLightbox = (items: PostMediaItem[], index: number) => {
    setLightbox({ items, index });
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
  };

  const handlePrevLightbox = () => {
    setLightbox((prev) =>
      prev
        ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }
        : null,
    );
  };

  const handleNextLightbox = () => {
    setLightbox((prev) =>
      prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null,
    );
  };

  // Navigation handlers
  const handleOpenUserProfile = (targetUserId: string) => {
    setReactionsPopover(null);
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatWithFriend = async (friendId: string) => {
    try {
      const conversation = await createDirectConversationMutation.mutateAsync({
        targetUserId: friendId,
      });
      navigate(
        `${ROUTES.CLIENT.MESSAGES}?conversationId=${encodeURIComponent(conversation.id)}`,
      );
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : 'Không thể mở cuộc trò chuyện lúc này.';
      toast.error(message);
    }
  };

  const handleOpenCreateVideoPost = () => {
    navigate(`${ROUTES.CLIENT.ROOT}?compose=1`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    currentUser,
    profileUser: currentUser,
    posts,
    totalItems,
    friends,
    scopeFilter,
    isAutoPlayEnabled,
    isMuted,
    activePostId: resolvedActivePostId,
    activePost,
    activePostIndex,
    slideDirection,
    canScrollPrev,
    canScrollNext,
    requestedPostId,
    isDeepLinkUnavailable,
    clipIndexByPost,
    isFeedLoading: videosQuery.isLoading,
    isFeedError: videosQuery.isError,
    isFeedRefetching: videosQuery.isRefetching,
    hasNextPage: Boolean(videosQuery.hasNextPage),
    isFetchingNextPage: videosQuery.isFetchingNextPage,
    scrollContainerRef,
    loadMoreSentinelRef,
    commentDrafts,
    commentMediaDrafts,
    commentErrors,
    mobileCommentsOpenMap,
    isSubmittingComment:
      createCommentMutation.isPending || uploadMediaMutation.isPending,
    reactionsPopover,
    reactionsModalPost,
    reactionsData: reactionsQuery.data ?? null,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isReactionsError: reactionsQuery.isError,
    lightbox,
    registerPostCardElement,
    handleSelectScopeFilter,
    handleClearDeepLink,
    handleRefreshVideos,
    handleLoadMore,
    handleToggleAutoPlay,
    handleToggleMute,
    handleActivatePost,
    handleStepClip,
    handleSelectClip,
    handleScrollToAdjacentPost,
    handleStageWheel,
    handleStageTouchStart,
    handleStageTouchEnd,
    handleReactPost,
    handleSharePost,
    handleCopyVideoLink,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    handleChangeReactionsFilter,
    handleChangeReactionsPage,
    handleRetryReactions,
    handleCommentDraftChange,
    handlePickCommentMedia,
    handleRemoveCommentMedia,
    handleSubmitComment,
    handleToggleMobileComments,
    handleFocusCommentInput,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevLightbox,
    handleNextLightbox,
    handleOpenUserProfile,
    handleOpenChatWithFriend,
    handleOpenCreateVideoPost,
  };
}

export type VideosController = ReturnType<typeof useVideosController>;
