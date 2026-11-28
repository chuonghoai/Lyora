import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isApiError,
  localStorageService,
  toast,
  useAuthStore,
} from '@/core';
import {
  createCommentSchema,
  createPostSchema,
  useBookmarkPostMutation,
  useCreateCommentMutation,
  useCreatePostMutation,
  useHidePostMutation,
  useInfinitePostsQuery,
  usePostReactionsQuery,
  useReactPostMutation,
  useSharePostMutation,
  useUnhidePostMutation,
  useUploadPostMediaMutation,
  type Post,
  type PostMediaItem,
  type PostMediaType,
  type PostsFeedFilter,
  type PostVisibility,
  type ReactionType,
} from '@/features/posts';
import { getClientPostDetailPath, getClientProfilePath, ROUTES } from '@/routes/paths';
import { usePostAiAssistant } from './post-ai-assistant.controller';

export interface MediaLightboxState {
  items: PostMediaItem[];
  index: number;
}

export interface ComposerTaggedUser {
  id: string;
  fullName: string;
}

interface ComposerDraft {
  content: string;
  visibility: PostVisibility;
  taggedUsers: ComposerTaggedUser[];
}

export interface FriendContactItem {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
}

export interface ReactionsPopoverState {
  postId: string;
  page: number;
  reactionType?: ReactionType;
}

export interface PostFeedProfileUser {
  id?: string;
  email?: string | null;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface UsePostFeedControllerOptions {
  filter?: PostsFeedFilter;
  authorId?: string;
  search?: string;
  visibility?: PostVisibility;
  limit?: number;
  enabled?: boolean;
  friends: FriendContactItem[];
  profileUser?: PostFeedProfileUser | null;
  draftStorageKey?: string;
  onOpenUserProfile?: (userId: string) => void;
  onOpenChatWithFriend?: (friendId: string) => void;
  hasBlockingExternalModal?: boolean;
}

const DEFAULT_COMPOSER_DRAFT_KEY = 'lyora:post-composer-draft';
const MAX_COMPOSER_MEDIA = 8;
export const MAX_AUDIO_RECORDING_SECONDS = 60;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveRecorderMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function resolveAudioExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export function usePostFeedController(options: UsePostFeedControllerOptions) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const draftStorageKey = options.draftStorageKey ?? DEFAULT_COMPOSER_DRAFT_KEY;

  const postsQuery = useInfinitePostsQuery(
    {
      limit: options.limit ?? 5,
      search: options.search,
      filter: options.filter ?? 'all',
      authorId: options.authorId,
      visibility: options.visibility,
    },
    { enabled: options.enabled ?? true },
  );

  const createPostMutation = useCreatePostMutation();
  const uploadMediaMutation = useUploadPostMediaMutation();
  const reactPostMutation = useReactPostMutation();
  const bookmarkPostMutation = useBookmarkPostMutation();
  const sharePostMutation = useSharePostMutation();
  const hidePostMutation = useHidePostMutation();
  const unhidePostMutation = useUnhidePostMutation();
  const createCommentMutation = useCreateCommentMutation();

  // Composer state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerVisibility, setComposerVisibility] = useState<PostVisibility>('PUBLIC');
  const [composerMedia, setComposerMedia] = useState<PostMediaItem[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isDraggingComposerMedia, setIsDraggingComposerMedia] = useState(false);
  const composerDragDepthRef = useRef(0);
  const composerPendingFilesRef = useRef<Map<string, File>>(new Map());
  const commentPendingFilesRef = useRef<Map<string, File>>(new Map());
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());
  const [composerTaggedUsers, setComposerTaggedUsers] = useState<ComposerTaggedUser[]>([]);
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [isComposerPreviewOpen, setIsComposerPreviewOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(
    () => (localStorageService.getItem<ComposerDraft>(draftStorageKey)?.content ?? '').trim().length > 0,
  );

  const getComposerMediaFiles = useCallback((): File[] => {
    const files: File[] = [];
    for (const item of composerMedia) {
      if (!item.id) continue;
      const pending = composerPendingFilesRef.current.get(item.id);
      if (pending) {
        files.push(pending);
      }
    }
    return files;
  }, [composerMedia]);

  const { clearAiUndo, resetAiAssistant, ...aiAssistant } = usePostAiAssistant({
    composerContent,
    composerVisibility,
    composerMedia,
    composerTaggedUsers,
    getComposerMediaFiles,
    setComposerContent,
    onClearComposerError: () => setComposerError(null),
  });

  // Voice recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);
  const audioDurationRef = useRef(0);
  const isRecordingCancelledRef = useRef(false);

  // Interaction & modal state
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentMediaDrafts, setCommentMediaDrafts] = useState<
    Record<string, PostMediaItem | null>
  >({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<Record<string, boolean>>({});
  const [temporarilyHiddenIds, setTemporarilyHiddenIds] = useState<Record<string, boolean>>({});
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [reactionsPopover, setReactionsPopover] = useState<ReactionsPopoverState | null>(null);
  const [lightbox, setLightbox] = useState<MediaLightboxState | null>(null);

  const reactionsQuery = usePostReactionsQuery(reactionsPopover?.postId ?? null, {
    page: reactionsPopover?.page ?? 1,
    limit: 10,
    reactionType: reactionsPopover?.reactionType,
  });

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  const detailPost = useMemo<Post | null>(() => {
    if (!detailPostId) return null;
    return posts.find((p) => p.id === detailPostId) ?? null;
  }, [detailPostId, posts]);

  const reactionsModalPost = useMemo<Post | null>(() => {
    if (!reactionsPopover) return null;
    return posts.find((p) => p.id === reactionsPopover.postId) ?? null;
  }, [reactionsPopover, posts]);

  const resolvedProfileUser = options.profileUser ?? currentUser;
  const totalItems = postsQuery.data?.pages[0]?.meta.totalItems ?? posts.length;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = postsQuery;

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

  useEffect(() => {
    if (!lightbox && !editingPost && !reactionsPopover && !detailPostId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightbox) {
          setLightbox(null);
        } else if (editingPost) {
          setEditingPost(null);
        } else if (reactionsPopover) {
          setReactionsPopover(null);
        } else if (!options.hasBlockingExternalModal && detailPostId) {
          setDetailPostId(null);
        }
      } else if (lightbox && event.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev
            ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }
            : null,
        );
      } else if (lightbox && event.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null,
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, editingPost, reactionsPopover, detailPostId, options.hasBlockingExternalModal]);

  const handleRefreshFeed = useCallback(async () => {
    setTemporarilyHiddenIds({});
    const result = await postsQuery.refetch();
    if (result.isError) {
      toast.error('Không thể làm mới danh sách bài viết. Vui lòng thử lại.');
      return;
    }
    toast.info('Đã làm mới danh sách bài viết mới nhất.');
  }, [postsQuery]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  // Composer handlers
  const handleExpandComposer = useCallback(() => {
    setIsComposerExpanded(true);
  }, []);

  const handleCollapseComposer = () => {
    composerDragDepthRef.current = 0;
    setIsDraggingComposerMedia(false);
    setIsComposerExpanded(false);
    setComposerError(null);
    resetAiAssistant();
  };

  const handleComposerContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerContent(e.target.value);
    clearAiUndo();
    if (composerError) setComposerError(null);
  };

  const handleComposerVisibilityChange = (visibility: PostVisibility) => {
    setComposerVisibility(visibility);
  };

  const handleCycleComposerVisibility = () => {
    setComposerVisibility((prev) =>
      prev === 'PUBLIC' ? 'FRIENDS' : prev === 'FRIENDS' ? 'PRIVATE' : 'PUBLIC',
    );
  };

  const addLocalMediaFiles = useCallback(
    (files: File[], preferredType?: PostMediaType) => {
      if (files.length === 0) return;

      const validFiles = files.filter((file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (preferredType === 'IMAGE') return isImage;
        if (preferredType === 'VIDEO') return isVideo;
        return isImage || isVideo;
      });

      if (validFiles.length === 0) {
        toast.warning(
          preferredType === 'IMAGE'
            ? 'Vui lòng chọn tệp hình ảnh hợp lệ.'
            : preferredType === 'VIDEO'
              ? 'Vui lòng chọn tệp video hợp lệ.'
              : 'Chỉ hỗ trợ kéo thả tệp hình ảnh hoặc video.',
        );
        return;
      }

      const remainingSlots = Math.max(0, MAX_COMPOSER_MEDIA - composerMedia.length);
      if (remainingSlots === 0) {
        toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
        return;
      }

      if (validFiles.length > remainingSlots) {
        toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
      }

      const selected = validFiles.slice(0, remainingSlots);
      const addedItems: PostMediaItem[] = selected.map((file, idx) => {
        const id = `local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        composerPendingFilesRef.current.set(id, file);
        const url = URL.createObjectURL(file);
        createdBlobUrlsRef.current.add(url);
        return {
          id,
          url,
          type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          alt: file.name,
          fileName: file.name,
          size: file.size,
        };
      });

      setIsComposerExpanded(true);
      setComposerMedia((prev) => [...prev, ...addedItems]);
      setComposerError(null);
    },
    [composerMedia.length],
  );

  const handlePickLocalMedia = (
    e: React.ChangeEvent<HTMLInputElement>,
    preferredType?: PostMediaType,
  ) => {
    const files = Array.from(e.target.files ?? []);
    addLocalMediaFiles(files, preferredType);
    e.target.value = '';
  };

  const handleDragEnterComposer = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    composerDragDepthRef.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDraggingComposerMedia(true);
    }
  };

  const handleDragOverComposer = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeaveComposer = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    composerDragDepthRef.current = Math.max(0, composerDragDepthRef.current - 1);
    if (composerDragDepthRef.current === 0) {
      setIsDraggingComposerMedia(false);
    }
  };

  const handleDropComposerMedia = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    composerDragDepthRef.current = 0;
    setIsDraggingComposerMedia(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    addLocalMediaFiles(files);
  };

  const handleRemoveMedia = (index: number) => {
    setComposerMedia((prev) => {
      const target = prev[index];
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      if (target?.id) {
        composerPendingFilesRef.current.delete(target.id);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // Audio recording
  const releaseAudioResources = useCallback(() => {
    if (audioTimerRef.current !== null) {
      window.clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecordingAudio(false);
  }, []);

  const stopAudioRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const cancelAudioRecording = useCallback(() => {
    isRecordingCancelledRef.current = true;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      releaseAudioResources();
    }
    setAudioRecordingDuration(0);
  }, [releaseAudioResources]);

  const startAudioRecording = async () => {
    if (isRecordingAudio) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.warning('Trình duyệt của bạn chưa hỗ trợ ghi âm.');
      return;
    }
    if (composerMedia.length >= MAX_COMPOSER_MEDIA) {
      toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
      return;
    }
    if (composerMedia.some((item) => item.type === 'AUDIO')) {
      toast.warning('Mỗi bài viết chỉ có một bản ghi âm. Hãy xóa bản ghi hiện tại trước.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = resolveRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      audioDurationRef.current = 0;
      isRecordingCancelledRef.current = false;
      setAudioRecordingDuration(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const wasCancelled = isRecordingCancelledRef.current;
        const recordedType = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0];
        const duration = audioDurationRef.current;
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        releaseAudioResources();

        if (wasCancelled || chunks.length === 0 || duration < 1) {
          if (!wasCancelled) toast.warning('Bản ghi âm quá ngắn, vui lòng thử lại.');
          setAudioRecordingDuration(0);
          return;
        }

        const file = new File(
          [new Blob(chunks, { type: recordedType })],
          `ghi-am-${Date.now()}.${resolveAudioExtension(recordedType)}`,
          { type: recordedType },
        );
        const id = `local-audio-${Date.now()}`;
        composerPendingFilesRef.current.set(id, file);
        const audioUrl = URL.createObjectURL(file);
        createdBlobUrlsRef.current.add(audioUrl);
        setComposerMedia((prev) => [
          ...prev,
          {
            id,
            url: audioUrl,
            type: 'AUDIO',
            alt: 'Bản ghi âm giọng nói',
            fileName: file.name,
            size: file.size,
            duration,
          },
        ]);
        setComposerError(null);
      };

      recorder.start();
      setIsComposerExpanded(true);
      setIsRecordingAudio(true);
      audioTimerRef.current = window.setInterval(() => {
        audioDurationRef.current += 1;
        setAudioRecordingDuration(audioDurationRef.current);
        if (audioDurationRef.current >= MAX_AUDIO_RECORDING_SECONDS) {
          stopAudioRecording();
        }
      }, 1000);
    } catch {
      releaseAudioResources();
      toast.error('Không thể truy cập micro. Vui lòng cấp quyền ghi âm cho trình duyệt.');
    }
  };

  useEffect(() => cancelAudioRecording, [cancelAudioRecording]);

  useEffect(() => {
    const blobUrls = createdBlobUrlsRef.current;
    const pendingFiles = composerPendingFilesRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
      pendingFiles.clear();
    };
  }, []);

  // Mention tagging
  const handleToggleMentionPicker = () => {
    setIsMentionPickerOpen((prev) => !prev);
  };

  const handleToggleTaggedUser = (friend: FriendContactItem) => {
    const isTagged = composerTaggedUsers.some((user) => user.id === friend.id);
    if (isTagged) {
      setComposerTaggedUsers((prev) => prev.filter((user) => user.id !== friend.id));
      return;
    }
    setComposerTaggedUsers((prev) => [...prev, { id: friend.id, fullName: friend.fullName }]);
    setComposerContent((prev) => `${prev}${prev && !/\s$/.test(prev) ? ' ' : ''}@${friend.fullName} `);
    clearAiUndo();
  };

  const handleRemoveTaggedUser = (userId: string) => {
    setComposerTaggedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleToggleComposerPreview = () => {
    setIsComposerPreviewOpen((prev) => !prev);
  };

  useEffect(() => {
    if (composerContent.trim().length === 0) return;
    const timer = window.setTimeout(() => {
      const draft: ComposerDraft = {
        content: composerContent,
        visibility: composerVisibility,
        taggedUsers: composerTaggedUsers,
      };
      localStorageService.setItem(draftStorageKey, draft);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [composerContent, composerVisibility, composerTaggedUsers, draftStorageKey]);

  const handleRestoreDraft = () => {
    const draft = localStorageService.getItem<ComposerDraft>(draftStorageKey);
    if (!draft) {
      setHasSavedDraft(false);
      return;
    }
    setComposerContent(draft.content);
    setComposerVisibility(draft.visibility);
    setComposerTaggedUsers(draft.taggedUsers ?? []);
    clearAiUndo();
    setIsComposerExpanded(true);
    setHasSavedDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorageService.removeItem(draftStorageKey);
    setHasSavedDraft(false);
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
      const pendingFiles = composerMedia.map((item) =>
        item.id ? composerPendingFilesRef.current.get(item.id) : undefined,
      );
      const filesToUpload = pendingFiles.filter((file): file is File => Boolean(file));
      const uploadedMedia =
        filesToUpload.length > 0 ? await uploadMediaMutation.mutateAsync(filesToUpload) : [];

      if (uploadedMedia.length !== filesToUpload.length) {
        throw new Error('Tải tệp lên chưa hoàn tất, vui lòng thử lại.');
      }

      let uploadCursor = 0;
      const finalMedia: PostMediaItem[] = validation.data.media.map((item, idx) => {
        if (!pendingFiles[idx]) return item;
        const uploaded = uploadedMedia[uploadCursor++];
        return {
          ...uploaded,
          alt: item.alt ?? uploaded.alt,
          duration: uploaded.duration ?? item.duration,
        };
      });

      await createPostMutation.mutateAsync({
        content: validation.data.content,
        visibility: validation.data.visibility,
        media: finalMedia,
        taggedUserIds: composerTaggedUsers
          .map((user) => user.id)
          .filter((id) => UUID_V4_PATTERN.test(id)),
      });

      composerMedia.forEach((item) => {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      });
      composerPendingFilesRef.current.clear();
      localStorageService.removeItem(draftStorageKey);
      setHasSavedDraft(false);
      composerDragDepthRef.current = 0;
      setIsDraggingComposerMedia(false);
      setComposerContent('');
      setComposerMedia([]);
      setComposerTaggedUsers([]);
      setIsMentionPickerOpen(false);
      setIsComposerPreviewOpen(false);
      setComposerError(null);
      resetAiAssistant();
      setIsComposerExpanded(false);

      toast.success('Đăng bài viết thành công!');
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể đăng bài viết lúc này.';
      toast.error(message);
    }
  };

  // Post interactions
  const handleReactPost = async (postId: string, reactionType: ReactionType) => {
    try {
      await reactPostMutation.mutateAsync({ postId, reactionType });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Không thể bày tỏ cảm xúc lúc này.';
      toast.error(message);
    }
  };

  const handleOpenReactionsPopover = (postId: string) => {
    setReactionsPopover({ postId, page: 1, reactionType: undefined });
  };

  const handleOpenReactionsModal = (postId: string) => {
    setReactionsPopover({ postId, page: 1, reactionType: undefined });
  };

  const handleCloseReactionsPopover = () => {
    setReactionsPopover(null);
  };

  const handleCloseReactionsModal = () => {
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
      const message = isApiError(err)
        ? err.message
        : 'Không thể cập nhật trạng thái lưu bài viết.';
      toast.error(message);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await sharePostMutation.mutateAsync(postId);
      const shareUrl = `${window.location.origin}${getClientPostDetailPath(postId)}`;
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
      const message = isApiError(err)
        ? err.message
        : 'Không thể hoàn tác ẩn bài viết lúc này.';
      toast.error(message);
    }
  };

  const handleCopyPostLink = async (postId: string) => {
    const shareUrl = `${window.location.origin}${getClientPostDetailPath(postId)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Đã sao chép liên kết bài viết.');
    } catch {
      toast.info('Không thể truy cập bộ nhớ tạm trên trình duyệt.');
    }
  };

  const handleOpenPostDetail = (postId: string) => {
    setDetailPostId(postId);
  };

  const handleOpenPostDetailPage = (
    postId: string,
    openOptions?: { expandAppeals?: boolean },
  ) => {
    navigate(getClientPostDetailPath(postId), {
      state: openOptions?.expandAppeals ? { expandAppeals: true } : undefined,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePostDetail = () => {
    setDetailPostId(null);
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setDetailPostId(null);
    setReactionsPopover(null);
    if (options.onOpenUserProfile) {
      options.onOpenUserProfile(targetUserId);
      return;
    }
    navigate(getClientProfilePath(targetUserId, currentUser?.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatWithFriend = (friendId: string) => {
    setReactionsPopover(null);
    if (options.onOpenChatWithFriend) {
      options.onOpenChatWithFriend(friendId);
      return;
    }
    navigate(ROUTES.CLIENT.MESSAGES);
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

    const existingDraft = commentMediaDrafts[postId];
    if (existingDraft?.url.startsWith('blob:')) {
      URL.revokeObjectURL(existingDraft.url);
      createdBlobUrlsRef.current.delete(existingDraft.url);
    }

    const url = URL.createObjectURL(file);
    createdBlobUrlsRef.current.add(url);
    commentPendingFilesRef.current.set(postId, file);
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
    const existing = commentMediaDrafts[postId];
    if (existing?.url.startsWith('blob:')) {
      URL.revokeObjectURL(existing.url);
      createdBlobUrlsRef.current.delete(existing.url);
    }
    commentPendingFilesRef.current.delete(postId);
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
      let uploadedMedia = parsed.data.media ?? null;
      const pendingFile = commentPendingFilesRef.current.get(postId);
      if (uploadedMedia && pendingFile) {
        const uploaded = await uploadMediaMutation.mutateAsync([pendingFile]);
        uploadedMedia = uploaded[0] ?? null;
      }

      await createCommentMutation.mutateAsync({
        postId,
        content: parsed.data.content,
        media: uploadedMedia,
      });

      if (mediaItem?.url.startsWith('blob:')) {
        URL.revokeObjectURL(mediaItem.url);
        createdBlobUrlsRef.current.delete(mediaItem.url);
      }
      commentPendingFilesRef.current.delete(postId);
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

  // Lightbox handlers
  const handleOpenEditPost = (post: Post) => {
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

  const handleRetryReactions = () => {
    void reactionsQuery.refetch();
  };

  return {
    currentUser,
    profileUser: resolvedProfileUser,
    friends: options.friends,
    posts,
    totalItems,
    isFeedLoading: postsQuery.isLoading,
    isFeedError: postsQuery.isError,
    isFeedRefetching: postsQuery.isRefetching && !postsQuery.isFetchingNextPage,
    hasNextPage: Boolean(postsQuery.hasNextPage),
    isFetchingNextPage: postsQuery.isFetchingNextPage,
    isFetchNextPageError: postsQuery.isFetchNextPageError,
    loadMoreSentinelRef,

    // Composer
    isComposerExpanded,
    composerContent,
    composerVisibility,
    composerMedia,
    composerError,
    isDraggingComposerMedia,
    isCreatingPost: createPostMutation.isPending || uploadMediaMutation.isPending,
    composerTaggedUsers,
    isMentionPickerOpen,
    isComposerPreviewOpen,
    showDraftBanner: hasSavedDraft && composerContent.trim().length === 0,
    isRecordingAudio,
    audioRecordingDuration,
    ...aiAssistant,

    // Interaction & Modal states
    commentDrafts,
    commentMediaDrafts,
    commentErrors,
    expandedCommentsMap,
    temporarilyHiddenIds,
    detailPostId,
    detailPost,
    editingPost,
    reactionsPopover,
    reactionsModalPost,
    reactionsData: reactionsQuery.data ?? null,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isReactionsError: reactionsQuery.isError,
    isSubmittingComment: createCommentMutation.isPending || uploadMediaMutation.isPending,
    isHidingPost: hidePostMutation.isPending,
    lightbox,

    // Handlers
    handleRefreshFeed,
    handleRetryReactions,
    handleLoadMore,
    handleExpandComposer,
    handleCollapseComposer,
    handleComposerContentChange,
    handleComposerVisibilityChange,
    handleCycleComposerVisibility,
    handlePickLocalMedia,
    handleDragEnterComposer,
    handleDragOverComposer,
    handleDragLeaveComposer,
    handleDropComposerMedia,
    handleRemoveMedia,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    handleToggleMentionPicker,
    handleToggleTaggedUser,
    handleRemoveTaggedUser,
    handleToggleComposerPreview,
    handleRestoreDraft,
    handleDiscardDraft,
    handleSubmitPost,
    handleReactPost,
    handleOpenReactionsPopover,
    handleCloseReactionsPopover,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    handleChangeReactionsPage,
    handleChangeReactionsFilter,
    handleToggleBookmark,
    handleSharePost,
    handleHidePost,
    handleUndoHidePost,
    handleCopyPostLink,
    handleOpenPostDetail,
    handleOpenPostDetailPage,
    handleClosePostDetail,
    handleOpenUserProfile,
    handleOpenChatWithFriend,
    handleCommentDraftChange,
    handlePickCommentMedia,
    handleRemoveCommentMedia,
    handleToggleExpandComments,
    handleFocusCommentInput,
    handleSubmitComment,
    handleOpenEditPost,
    handleCloseEditPost,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevLightbox,
    handleNextLightbox,
  };
}

export type PostFeedController = ReturnType<typeof usePostFeedController>;
