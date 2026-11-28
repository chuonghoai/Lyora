import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isApiError, toast, useAuthStore } from '@/core';
import { useAcceptedFriendsQuery } from '@/features/friends';
import {
  createCommentSchema,
  useBookmarkPostMutation,
  useCreateCommentMutation,
  useCreatePostAppealMutation,
  useInfinitePostCommentsQuery,
  usePostDetailQuery,
  usePostReactionsQuery,
  useReactPostMutation,
  useSharePostMutation,
  useUploadPostMediaMutation,
  type Post,
  type PostMediaItem,
  type PostMediaType,
  type ReactionType,
} from '@/features/posts';
import {
  getClientPostDetailPath,
  getClientProfilePath,
  ROUTES,
} from '@/routes/paths';
import type {
  FriendContactItem,
  MediaLightboxState,
  ReactionsPopoverState,
} from '../home/post-feed.controller';

export function useClientPostDetailController() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const normalizedPostId = postId?.trim() || null;
  const [isAppealsExpanded, setIsAppealsExpanded] = useState(true);

  const postQuery = usePostDetailQuery(normalizedPostId, {
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.error ? false : 10_000),
  });
  const commentsQuery = useInfinitePostCommentsQuery(normalizedPostId, 10);
  const friendsQuery = useAcceptedFriendsQuery();

  const reactPostMutation = useReactPostMutation();
  const bookmarkPostMutation = useBookmarkPostMutation();
  const sharePostMutation = useSharePostMutation();
  const createCommentMutation = useCreateCommentMutation();
  const uploadMediaMutation = useUploadPostMediaMutation();
  const createAppealMutation = useCreatePostAppealMutation();

  const [commentDraft, setCommentDraft] = useState('');
  const [commentMedia, setCommentMedia] = useState<PostMediaItem | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const commentPendingFileRef = useRef<File | null>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  const [lightbox, setLightbox] = useState<MediaLightboxState | null>(null);
  const [reactionsPopover, setReactionsPopover] =
    useState<ReactionsPopoverState | null>(null);
  const [appealTargetPost, setAppealTargetPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const reactionsQuery = usePostReactionsQuery(
    reactionsPopover?.postId ?? null,
    {
      page: reactionsPopover?.page ?? 1,
      limit: 8,
      reactionType: reactionsPopover?.reactionType,
    },
  );

  useEffect(() => {
    const urls = createdBlobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (appealTargetPost) {
        if (!createAppealMutation.isPending) setAppealTargetPost(null);
      } else if (lightbox) {
        setLightbox(null);
      } else if (editingPost) {
        setEditingPost(null);
      } else if (reactionsPopover) {
        setReactionsPopover(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appealTargetPost, createAppealMutation.isPending, editingPost, lightbox, reactionsPopover]);

  const post = postQuery.data ?? null;
  const isPostNotFound = Boolean(
    !normalizedPostId ||
      (postQuery.isError &&
        isApiError(postQuery.error) &&
        postQuery.error.statusCode === 404),
  );

  const prevModerationStatusRef = useRef(post?.moderationStatus);

  useEffect(() => {
    const previousStatus = prevModerationStatusRef.current;
    const nextStatus = post?.moderationStatus;
    if (previousStatus === 'HIDDEN' && nextStatus === 'ACTIVE') {
      setAppealTargetPost(null);
      toast.info('Bài viết đã được Quản trị viên khôi phục hiển thị.');
    }
    prevModerationStatusRef.current = nextStatus;
  }, [post?.moderationStatus]);

  useEffect(() => {
    if (isPostNotFound) {
      setAppealTargetPost(null);
      setReactionsPopover(null);
      setLightbox(null);
    }
  }, [isPostNotFound]);

  const friends = useMemo<FriendContactItem[]>(
    () =>
      (friendsQuery.data ?? []).map((friend) => ({
        id: friend.id,
        fullName: friend.fullName,
        avatarUrl: friend.avatarUrl,
        isOnline: Boolean(friend.isOnline),
      })),
    [friendsQuery.data],
  );

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [commentsQuery.data],
  );
  const totalRootComments = commentsQuery.data?.pages[0]?.meta.totalItems ?? 0;

  const isOwnPost = Boolean(
    post &&
      currentUser &&
      (post.author.id === currentUser.id ||
        (currentUser.email && post.author.email === currentUser.email)),
  );

  const appealsList = useMemo(() => {
    if (!post) return [];
    if (post.appeals && post.appeals.length > 0) return post.appeals;
    return post.appeal ? [post.appeal] : [];
  }, [post]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(ROUTES.CLIENT.ROOT);
  };

  const handleNavigateToFeed = () => {
    navigate(ROUTES.CLIENT.ROOT);
  };

  const handleNavigateToMyProfile = () => {
    navigate(getClientProfilePath(currentUser?.id, currentUser?.id));
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setReactionsPopover(null);
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatWithFriend = () => {
    setReactionsPopover(null);
    navigate(ROUTES.CLIENT.MESSAGES);
  };

  const handleToggleAppealsExpanded = () => {
    setIsAppealsExpanded((prev) => !prev);
  };

  const handleCopyPostLink = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}${getClientPostDetailPath(post.id)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Đã sao chép liên kết bài viết.');
    } catch {
      toast.info('Không thể truy cập bộ nhớ tạm trên trình duyệt.');
    }
  };

  const handleReactPost = async (reactionType: ReactionType) => {
    if (!post) return;
    try {
      await reactPostMutation.mutateAsync({ postId: post.id, reactionType });
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : 'Không thể bày tỏ cảm xúc lúc này.',
      );
    }
  };

  const handleToggleBookmark = async () => {
    if (!post) return;
    try {
      const updated = await bookmarkPostMutation.mutateAsync(post.id);
      toast.success(
        updated.isBookmarked
          ? 'Đã lưu bài viết vào danh sách của bạn.'
          : 'Đã bỏ lưu bài viết.',
      );
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : 'Không thể lưu bài viết lúc này.',
      );
    }
  };

  const handleSharePost = async () => {
    if (!post) return;
    try {
      await sharePostMutation.mutateAsync(post.id);
      const shareUrl = `${window.location.origin}${getClientPostDetailPath(post.id)}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
      }
      toast.success('Đã chia sẻ bài viết và sao chép liên kết!');
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : 'Không thể chia sẻ bài viết lúc này.',
      );
    }
  };

  const handleCommentDraftChange = (value: string) => {
    setCommentDraft(value);
    if (commentError) setCommentError(null);
  };

  const handlePickCommentMedia = (
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

    if (commentMedia?.url.startsWith('blob:')) {
      URL.revokeObjectURL(commentMedia.url);
      createdBlobUrlsRef.current.delete(commentMedia.url);
    }
    const url = URL.createObjectURL(file);
    createdBlobUrlsRef.current.add(url);
    commentPendingFileRef.current = file;
    setCommentMedia({
      id: `cmt-detail-media-${Date.now()}`,
      url,
      type: expectedType,
      alt: file.name,
    });
    if (commentError) setCommentError(null);
    e.target.value = '';
  };

  const handleRemoveCommentMedia = () => {
    if (commentMedia?.url.startsWith('blob:')) {
      URL.revokeObjectURL(commentMedia.url);
      createdBlobUrlsRef.current.delete(commentMedia.url);
    }
    commentPendingFileRef.current = null;
    setCommentMedia(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const parsed = createCommentSchema.safeParse({
      content: commentDraft,
      media: commentMedia,
    });
    if (!parsed.success) {
      setCommentError(
        parsed.error.issues[0]?.message ??
          'Vui lòng nhập nội dung hoặc đính kèm ảnh/video',
      );
      return;
    }

    try {
      let uploadedMedia = parsed.data.media ?? null;
      const pendingFile = commentPendingFileRef.current;
      if (uploadedMedia && pendingFile) {
        const uploaded = await uploadMediaMutation.mutateAsync([pendingFile]);
        uploadedMedia = uploaded[0] ?? null;
      }

      await createCommentMutation.mutateAsync({
        postId: post.id,
        content: parsed.data.content,
        media: uploadedMedia,
      });

      if (commentMedia?.url.startsWith('blob:')) {
        URL.revokeObjectURL(commentMedia.url);
        createdBlobUrlsRef.current.delete(commentMedia.url);
      }
      commentPendingFileRef.current = null;
      setCommentDraft('');
      setCommentMedia(null);
      setCommentError(null);
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : 'Không thể gửi bình luận lúc này.',
      );
    }
  };

  const handleFocusCommentInput = () => {
    const el = document.getElementById('client-post-detail-comment-input');
    el?.focus();
  };

  const handleLoadMoreComments = useCallback(() => {
    if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
      void commentsQuery.fetchNextPage();
    }
  }, [commentsQuery]);

  const handleOpenAppealModal = () => {
    if (!post) return;
    setAppealTargetPost(post);
  };

  const handleCloseAppealModal = () => {
    if (createAppealMutation.isPending) return;
    setAppealTargetPost(null);
  };

  const handleSubmitPostAppeal = async (payload: {
    reasonCategory: string;
    reasonDetail: string;
  }) => {
    if (!appealTargetPost) return;
    try {
      await createAppealMutation.mutateAsync({
        postId: appealTargetPost.id,
        reasonCategory: payload.reasonCategory,
        reasonDetail: payload.reasonDetail,
      });
      setAppealTargetPost(null);
      setIsAppealsExpanded(true);
      toast.success('Đã gửi khiếu nại bài viết tới Ban Quản Trị để xem xét.');
    } catch (err) {
      toast.error(
        isApiError(err)
          ? err.message
          : 'Không thể gửi khiếu nại bài viết lúc này.',
      );
    }
  };

  const handleOpenReactionsModal = () => {
    if (!post) return;
    setReactionsPopover({ postId: post.id, page: 1, reactionType: undefined });
  };

  const handleCloseReactionsModal = () => {
    setReactionsPopover(null);
  };

  const handleChangeReactionsFilter = (reactionType?: ReactionType) => {
    setReactionsPopover((prev) =>
      prev ? { ...prev, page: 1, reactionType } : null,
    );
  };

  const handleChangeReactionsPage = (page: number) => {
    setReactionsPopover((prev) => (prev ? { ...prev, page } : null));
  };

  const handleRetryReactions = () => {
    void reactionsQuery.refetch();
  };

  const handleOpenEditPost = () => {
    if (!post) return;
    setEditingPost(post);
  };

  const handleCloseEditPost = () => {
    setEditingPost(null);
  };

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

  return {
    postId: normalizedPostId,
    currentUser,
    profileUser: currentUser,
    post,
    isOwnPost,
    appealsList,
    isAppealsExpanded,
    isLoading: postQuery.isLoading,
    isError: postQuery.isError && !isPostNotFound,
    isPostNotFound,
    comments,
    totalRootComments,
    isCommentsLoading: commentsQuery.isLoading,
    isCommentsError: commentsQuery.isError,
    hasNextCommentsPage: Boolean(commentsQuery.hasNextPage),
    isFetchingNextComments: commentsQuery.isFetchingNextPage,
    isFetchNextCommentsError: commentsQuery.isFetchNextPageError,
    commentDraft,
    commentMedia,
    commentError,
    isSubmittingComment:
      createCommentMutation.isPending || uploadMediaMutation.isPending,
    friends,
    reactionsPopover,
    reactionsModalPost: post,
    reactionsData: reactionsQuery.data ?? null,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isReactionsError: reactionsQuery.isError,
    lightbox,
    editingPost,
    appealTargetPost,
    isSubmittingAppeal: createAppealMutation.isPending,
    handleGoBack,
    handleNavigateToFeed,
    handleNavigateToMyProfile,
    handleOpenUserProfile,
    handleOpenChatWithFriend,
    handleRetryPost: () => void postQuery.refetch(),
    handleRetryComments: () => void commentsQuery.refetch(),
    handleLoadMoreComments,
    handleToggleAppealsExpanded,
    handleCopyPostLink,
    handleReactPost,
    handleToggleBookmark,
    handleSharePost,
    handleCommentDraftChange,
    handlePickCommentMedia,
    handleRemoveCommentMedia,
    handleSubmitComment,
    handleFocusCommentInput,
    handleOpenAppealModal,
    handleCloseAppealModal,
    handleSubmitPostAppeal,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    handleChangeReactionsFilter,
    handleChangeReactionsPage,
    handleRetryReactions,
    handleOpenEditPost,
    handleCloseEditPost,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevLightbox,
    handleNextLightbox,
  };
}

export type ClientPostDetailController = ReturnType<
  typeof useClientPostDetailController
>;
