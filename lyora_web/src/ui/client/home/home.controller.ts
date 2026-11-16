import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isApiError,
  toast,
  useAuthStore,
  useDebounce,
} from '@/core';
import {
  createCommentSchema,
  createPostSchema,
  mediaUrlInputSchema,
  useBookmarkPostMutation,
  useCreateCommentMutation,
  useCreatePostMutation,
  useFriendsQuery,
  useHidePostMutation,
  useInfinitePostsQuery,
  usePostReactionsQuery,
  useReactPostMutation,
  useSharePostMutation,
  useUnhidePostMutation,
  type Post,
  type PostMediaItem,
  type PostMediaType,
  type PostsFeedFilter,
  type PostVisibility,
  type ReactionType,
} from '@/features/posts';

export type VisibilityFilterOption = 'ALL' | PostVisibility;

export interface MediaLightboxState {
  items: PostMediaItem[];
  index: number;
}

export interface FriendContactItem {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
}

export interface ChatReplySnapshot {
  id: string;
  senderName: string;
  text: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isMine: boolean;
  reaction?: string | null;
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

export interface ReactionsPopoverState {
  postId: string;
  page: number;
  reactionType?: ReactionType;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const searchQuery = searchParams.get('q') ?? '';
  const debouncedSearch = useDebounce(searchQuery, 350);

  const tabParam = searchParams.get('tab');
  const activeTab: PostsFeedFilter =
    tabParam === 'mine' || tabParam === 'saved' ? tabParam : 'all';

  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterOption>('ALL');

  // Data Layer Query (Infinite Pagination)
  const postsQuery = useInfinitePostsQuery({
    limit: 5,
    search: debouncedSearch,
    filter: activeTab,
    visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
  });
  const friendsQuery = useFriendsQuery();

  const createPostMutation = useCreatePostMutation();
  const reactPostMutation = useReactPostMutation();
  const bookmarkPostMutation = useBookmarkPostMutation();
  const sharePostMutation = useSharePostMutation();
  const hidePostMutation = useHidePostMutation();
  const unhidePostMutation = useUnhidePostMutation();
  const createCommentMutation = useCreateCommentMutation();

  // Composer State
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerVisibility, setComposerVisibility] = useState<PostVisibility>('PUBLIC');
  const [composerMedia, setComposerMedia] = useState<PostMediaItem[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<PostMediaType>('IMAGE');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [mediaUrlError, setMediaUrlError] = useState<string | null>(null);
  const [showMediaAdder, setShowMediaAdder] = useState(false);

  // Comment, Hide, Detail Modal, Reactors Popover & Lightbox State
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentMediaDrafts, setCommentMediaDrafts] = useState<
    Record<string, PostMediaItem | null>
  >({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<Record<string, boolean>>({});
  const [temporarilyHiddenIds, setTemporarilyHiddenIds] = useState<Record<string, boolean>>({});
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [reactionsPopover, setReactionsPopover] = useState<ReactionsPopoverState | null>(null);
  const [lightbox, setLightbox] = useState<MediaLightboxState | null>(null);

  const reactionsQuery = usePostReactionsQuery(reactionsPopover?.postId ?? null, {
    page: reactionsPopover?.page ?? 1,
    limit: 10,
    reactionType: reactionsPopover?.reactionType,
  });

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

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  const detailPost = useMemo<Post | null>(() => {
    if (!detailPostId) return null;
    return posts.find((p) => p.id === detailPostId) ?? null;
  }, [detailPostId, posts]);

  const totalItems = postsQuery.data?.pages[0]?.meta.totalItems ?? posts.length;
  const isPreviewFallback = Boolean(
    postsQuery.data?.pages.some((page) => page.isPreviewFallback),
  );

  // Danh sách bạn bè độc lập với bộ lọc bài viết
  const friends = useMemo<FriendContactItem[]>(() => {
    const rawFriends = friendsQuery.data ?? [];
    return rawFriends.map((author) => ({
      id: author.id,
      fullName: author.fullName,
      avatarUrl: author.avatarUrl,
      isOnline: true,
    }));
  }, [friendsQuery.data]);

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
          reaction: '❤️',
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

  const savedPostsCount = useMemo(
    () => posts.filter((post) => post.isBookmarked).length,
    [posts],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = postsQuery;

  // Infinite Scroll tự động tải trang kế tiếp khi cuộn đến cuối danh sách
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Đóng Lightbox / PostDetailModal bằng phím Escape
  useEffect(() => {
    if (!lightbox && !detailPostId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightbox) {
          setLightbox(null);
        } else if (detailPostId) {
          setDetailPostId(null);
        }
      } else if (lightbox && event.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : null,
        );
      } else if (lightbox && event.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null,
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, detailPostId]);

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

  const handleRefreshFeed = useCallback(async () => {
    setTemporarilyHiddenIds({});
    await postsQuery.refetch();
    toast.info('Đã làm mới bảng tin mới nhất.');
  }, [postsQuery]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  // Composer Handlers
  const handleExpandComposer = (mediaType?: PostMediaType) => {
    setIsComposerExpanded(true);
    if (mediaType) {
      setShowMediaAdder(true);
      setMediaTypeInput(mediaType);
    }
  };

  const handleCollapseComposer = () => {
    setIsComposerExpanded(false);
    setShowMediaAdder(false);
    setComposerError(null);
    setMediaUrlError(null);
  };

  const handleComposerContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerContent(e.target.value);
    if (composerError) setComposerError(null);
  };

  const handleComposerVisibilityChange = (visibility: PostVisibility) => {
    setComposerVisibility(visibility);
  };

  const handleToggleMediaAdder = (preferredType?: PostMediaType) => {
    setIsComposerExpanded(true);
    if (preferredType) {
      setMediaTypeInput(preferredType);
      setShowMediaAdder(true);
      return;
    }
    setShowMediaAdder((prev) => !prev);
  };

  const handleMediaUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaUrlInput(e.target.value);
    if (mediaUrlError) setMediaUrlError(null);
  };

  const handleMediaTypeInputChange = (type: PostMediaType) => {
    setMediaTypeInput(type);
  };

  const handleAddMediaUrl = () => {
    if (composerMedia.length >= 8) {
      setMediaUrlError('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh hoặc video.');
      return;
    }

    const parsed = mediaUrlInputSchema.safeParse(mediaUrlInput);
    if (!parsed.success) {
      setMediaUrlError(parsed.error.issues[0]?.message ?? 'Đường dẫn không hợp lệ');
      return;
    }

    setComposerMedia((prev) => [
      ...prev,
      {
        id: `media-${Date.now()}-${prev.length}`,
        url: parsed.data,
        type: mediaTypeInput,
        alt: mediaTypeInput === 'IMAGE' ? 'Ảnh đính kèm bài viết' : 'Video đính kèm bài viết',
      },
    ]);
    setMediaUrlInput('');
    setMediaUrlError(null);
    setComposerError(null);
  };

  const handlePickLocalMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 8 - composerMedia.length);
    if (remainingSlots === 0) {
      toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh hoặc video.');
      e.target.value = '';
      return;
    }

    const selected = files.slice(0, remainingSlots);
    const addedItems: PostMediaItem[] = [];

    for (const file of selected) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) continue;

      const objectUrl = URL.createObjectURL(file);
      addedItems.push({
        id: `local-${Date.now()}-${addedItems.length}`,
        url: objectUrl,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        alt: file.name,
      });
    }

    if (addedItems.length > 0) {
      setIsComposerExpanded(true);
      setComposerMedia((prev) => [...prev, ...addedItems]);
      setComposerError(null);
    }

    e.target.value = '';
  };

  const handleRemoveMedia = (index: number) => {
    setComposerMedia((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = createPostSchema.safeParse({
      content: composerContent,
      visibility: composerVisibility,
      media: composerMedia,
    });

    if (!validation.success) {
      setComposerError(
        validation.error.issues[0]?.message ?? 'Nội dung bài viết chưa hợp lệ',
      );
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        content: validation.data.content,
        visibility: validation.data.visibility,
        media: validation.data.media,
      });

      setComposerContent('');
      setComposerMedia([]);
      setMediaUrlInput('');
      setComposerError(null);
      setMediaUrlError(null);
      setShowMediaAdder(false);
      setIsComposerExpanded(false);

      toast.success('Đăng bài viết thành công!');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể đăng bài viết lúc này.';
      toast.error(message);
    }
  };

  // Post Interactions
  const handleReactPost = async (postId: string, reactionType: ReactionType) => {
    try {
      await reactPostMutation.mutateAsync({ postId, reactionType });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể bày tỏ cảm xúc lúc này.';
      toast.error(message);
    }
  };

  // Reactors Popover (Hover số lượt thả Emotes + Pagination)
  const handleOpenReactionsPopover = (postId: string) => {
    setReactionsPopover((prev) =>
      prev?.postId === postId ? prev : { postId, page: 1, reactionType: undefined },
    );
  };

  const handleCloseReactionsPopover = () => {
    setReactionsPopover(null);
  };

  const handleChangeReactionsPage = (page: number) => {
    setReactionsPopover((prev) => (prev ? { ...prev, page } : null));
  };

  const handleChangeReactionsFilter = (reactionType?: ReactionType) => {
    setReactionsPopover((prev) =>
      prev ? { ...prev, page: 1, reactionType } : null,
    );
  };

  const handleToggleBookmark = async (postId: string) => {
    try {
      const updated = await bookmarkPostMutation.mutateAsync(postId);
      if (updated.isBookmarked) {
        toast.success('Đã lưu bài viết vào danh sách.');
      } else {
        toast.info('Đã bỏ lưu bài viết.');
      }
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể cập nhật trạng thái lưu bài viết.';
      toast.error(message);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await sharePostMutation.mutateAsync(postId);
      const shareUrl = `${window.location.origin}/?post=${encodeURIComponent(postId)}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
      }
      toast.success('Đã chia sẻ bài viết và sao chép liên kết!');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể chia sẻ bài viết lúc này.';
      toast.error(message);
    }
  };

  const handleHidePost = async (postId: string) => {
    setTemporarilyHiddenIds((prev) => ({ ...prev, [postId]: true }));
    if (detailPostId === postId) {
      setDetailPostId(null);
    }
    try {
      await hidePostMutation.mutateAsync(postId);
    } catch (err) {
      setTemporarilyHiddenIds((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      const message = isApiError(err) ? err.message : 'Không thể ẩn bài viết lúc này.';
      toast.error(message);
    }
  };

  const handleUndoHidePost = async (postId: string) => {
    setTemporarilyHiddenIds((prev) => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
    try {
      await unhidePostMutation.mutateAsync(postId);
      toast.success('Đã hiển thị lại bài viết.');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể hoàn tác ẩn bài viết lúc này.';
      toast.error(message);
    }
  };

  const handleCopyPostLink = async (postId: string) => {
    const shareUrl = `${window.location.origin}/?post=${encodeURIComponent(postId)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Đã sao chép liên kết bài viết.');
    } catch {
      toast.info('Không thể truy cập bộ nhớ tạm trên trình duyệt.');
    }
  };

  // Post Detail Modal Handlers
  const handleOpenPostDetail = (postId: string) => {
    setDetailPostId(postId);
  };

  const handleClosePostDetail = () => {
    setDetailPostId(null);
  };

  // Comments + Image/Video Attachment Handlers
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
    expectedType: PostMediaType,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if ((expectedType === 'IMAGE' && !isImage) || (expectedType === 'VIDEO' && !isVideo)) {
      toast.warning(
        expectedType === 'IMAGE'
          ? 'Vui lòng chọn tệp hình ảnh hợp lệ.'
          : 'Vui lòng chọn tệp video ngắn hợp lệ.',
      );
      e.target.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    setCommentMediaDrafts((prev) => ({
      ...prev,
      [postId]: {
        id: `cmt-media-${Date.now()}`,
        url,
        type: expectedType,
        alt: file.name,
      },
    }));
    if (commentErrors[postId]) {
      setCommentErrors((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
    e.target.value = '';
  };

  const handleRemoveCommentMedia = (postId: string) => {
    setCommentMediaDrafts((prev) => ({ ...prev, [postId]: null }));
  };

  const handleToggleExpandComments = (postId: string) => {
    setExpandedCommentsMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleFocusCommentInput = (postId: string, suffix: 'feed' | 'modal' = 'feed') => {
    setExpandedCommentsMap((prev) => ({ ...prev, [postId]: true }));
    const inputEl = document.getElementById(`comment-input-${suffix}-${postId}`);
    inputEl?.focus();
  };

  const handleSubmitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const rawValue = commentDrafts[postId] ?? '';
    const mediaItem = commentMediaDrafts[postId] ?? null;

    const parsed = createCommentSchema.safeParse({
      content: rawValue,
      media: mediaItem,
    });

    if (!parsed.success) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]:
          parsed.error.issues[0]?.message ??
          'Vui lòng nhập nội dung hoặc đính kèm ảnh/video',
      }));
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: parsed.data.content,
        media: parsed.data.media ?? null,
      });
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setCommentMediaDrafts((prev) => ({ ...prev, [postId]: null }));
      setCommentErrors((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      setExpandedCommentsMap((prev) => ({ ...prev, [postId]: true }));
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể gửi bình luận lúc này.';
      toast.error(message);
    }
  };

  // Multi-Window Friend Chat Box Handlers (3 mở hẳn + 2 avatar rút gọn = 5 tối đa)
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
    appendOutgoingChatMessage(friendId, '👍');
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

  const handleReactChatMessage = (friendId: string, msgId: string, emoji: string) => {
    const friend = getFriendById(friendId);
    if (!friend) return;
    const baseMessages = ensureFriendConversation(friend);
    setChatMessagesByFriend((prev) => ({
      ...prev,
      [friendId]: baseMessages.map((m) =>
        m.id === msgId
          ? { ...m, reaction: m.reaction === emoji ? null : emoji }
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

  // Lightbox Handlers
  const handleOpenLightbox = (items: PostMediaItem[], index: number) => {
    setLightbox({ items, index });
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
  };

  const handlePrevLightbox = () => {
    setLightbox((prev) =>
      prev ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : null,
    );
  };

  const handleNextLightbox = () => {
    setLightbox((prev) =>
      prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null,
    );
  };

  return {
    // General & Query States
    appTitle,
    currentUser,
    posts,
    totalItems,
    friends,
    savedPostsCount,
    activeTab,
    visibilityFilter,
    searchQuery,
    debouncedSearch,
    isPreviewFallback,
    isFeedLoading: postsQuery.isLoading,
    isFeedError: postsQuery.isError,
    isFeedRefetching: postsQuery.isRefetching && !postsQuery.isFetchingNextPage,
    hasNextPage: Boolean(postsQuery.hasNextPage),
    isFetchingNextPage: postsQuery.isFetchingNextPage,
    loadMoreSentinelRef,

    // Composer States
    isComposerExpanded,
    composerContent,
    composerVisibility,
    composerMedia,
    mediaUrlInput,
    mediaTypeInput,
    composerError,
    mediaUrlError,
    showMediaAdder,
    isCreatingPost: createPostMutation.isPending,

    // Interaction, Comment Media, Detail Modal & Reactors Popover States
    commentDrafts,
    commentMediaDrafts,
    commentErrors,
    expandedCommentsMap,
    temporarilyHiddenIds,
    detailPostId,
    detailPost,
    reactionsPopover,
    reactionsData: reactionsQuery.data ?? null,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isSubmittingComment: createCommentMutation.isPending,
    isHidingPost: hidePostMutation.isPending,
    lightbox,

    // Multi-Window Mini Chat Widget States
    maxExpandedChatWindows: MAX_EXPANDED_CHAT_WINDOWS,
    maxTotalChatWindows: MAX_TOTAL_CHAT_WINDOWS,
    maxChatWindows: MAX_EXPANDED_CHAT_WINDOWS,
    openChatWindows,
    forwardingState,
    getFriendById,
    getMessagesForFriend,
    getPinnedMessageForFriend,

    // Handlers
    handleSelectTab,
    handleSelectVisibilityFilter,
    handleClearFilters,
    handleRefreshFeed,
    handleLoadMore,
    handleExpandComposer,
    handleCollapseComposer,
    handleComposerContentChange,
    handleComposerVisibilityChange,
    handleToggleMediaAdder,
    handleMediaUrlInputChange,
    handleMediaTypeInputChange,
    handleAddMediaUrl,
    handlePickLocalMedia,
    handleRemoveMedia,
    handleSubmitPost,
    handleReactPost,
    handleOpenReactionsPopover,
    handleCloseReactionsPopover,
    handleChangeReactionsPage,
    handleChangeReactionsFilter,
    handleToggleBookmark,
    handleSharePost,
    handleHidePost,
    handleUndoHidePost,
    handleCopyPostLink,
    handleOpenPostDetail,
    handleClosePostDetail,
    handleCommentDraftChange,
    handlePickCommentMedia,
    handleRemoveCommentMedia,
    handleToggleExpandComments,
    handleFocusCommentInput,
    handleSubmitComment,
    handleOpenChatWithFriend,
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
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevLightbox,
    handleNextLightbox,
  };
}

export { useHomeController as useClientHomeController };
export type HomeController = ReturnType<typeof useHomeController>;
