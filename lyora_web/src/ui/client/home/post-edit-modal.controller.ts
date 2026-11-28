import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiError, toast } from '@/core';
import {
  updatePostSchema,
  useUpdatePostMutation,
  useUploadPostMediaMutation,
  type Post,
  type PostMediaItem,
  type PostMediaType,
  type PostVisibility,
} from '@/features/posts';
import { usePostAiAssistant } from './post-ai-assistant.controller';
import {
  MAX_AUDIO_RECORDING_SECONDS,
  type ComposerTaggedUser,
  type FriendContactItem,
  type PostFeedProfileUser,
} from './post-feed.controller';

const MAX_POST_MEDIA = 8;
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

function resolveInitialTaggedUsers(
  post: Post,
  friends: FriendContactItem[],
): ComposerTaggedUser[] {
  if (post.taggedUsers && post.taggedUsers.length > 0) {
    return post.taggedUsers.map((user) => ({
      id: user.id,
      fullName: user.fullName,
    }));
  }

  const ids = post.taggedUserIds ?? [];
  if (ids.length === 0) return [];

  const friendMap = new Map(friends.map((friend) => [friend.id, friend.fullName]));
  return ids
    .map((id) => {
      const fullName = friendMap.get(id);
      return fullName ? { id, fullName } : null;
    })
    .filter((item): item is ComposerTaggedUser => Boolean(item));
}

export interface UsePostEditModalControllerOptions {
  post: Post | null;
  friends: FriendContactItem[];
  profileUser?: PostFeedProfileUser | null;
  onClose: () => void;
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}

export function usePostEditModalController({
  post,
  friends,
  profileUser,
  onClose,
  onOpenLightbox,
}: UsePostEditModalControllerOptions) {
  const uploadMediaMutation = useUploadPostMediaMutation();
  const updatePostMutation = useUpdatePostMutation();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [media, setMedia] = useState<PostMediaItem[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<ComposerTaggedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const dragDepthRef = useRef(0);
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);
  const audioDurationRef = useRef(0);
  const isRecordingCancelledRef = useRef(false);

  const getEditMediaFiles = useCallback((): File[] => {
    const files: File[] = [];
    for (const item of media) {
      if (!item.id) continue;
      const pending = pendingFilesRef.current.get(item.id);
      if (pending) files.push(pending);
    }
    return files;
  }, [media]);

  const { resetAiAssistant, clearAiUndo, ...aiAssistant } = usePostAiAssistant({
    composerContent: content,
    composerVisibility: visibility,
    composerMedia: media,
    composerTaggedUsers: taggedUsers,
    getComposerMediaFiles: getEditMediaFiles,
    setComposerContent: setContent,
    onClearComposerError: () => setError(null),
  });

  const resetAiRef = useRef(resetAiAssistant);
  resetAiRef.current = resetAiAssistant;
  const friendsRef = useRef(friends);
  friendsRef.current = friends;

  const revokeLocalResources = useCallback(() => {
    createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdBlobUrlsRef.current.clear();
    pendingFilesRef.current.clear();
  }, []);

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

  const stopAudioRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  useEffect(() => {
    cancelAudioRecording();
    revokeLocalResources();
    dragDepthRef.current = 0;
    setIsDraggingMedia(false);
    setIsMentionPickerOpen(false);
    setIsPreviewOpen(false);
    setError(null);
    resetAiRef.current();

    if (!post) {
      setContent('');
      setVisibility('PUBLIC');
      setMedia([]);
      setTaggedUsers([]);
      return;
    }

    setContent(post.content ?? '');
    setVisibility(post.visibility);
    setMedia(
      (post.media ?? []).map((item, idx) => ({
        ...item,
        id: item.id ?? `existing-${post.id}-${idx}`,
      })),
    );
    setTaggedUsers(resolveInitialTaggedUsers(post, friendsRef.current));
  }, [post, cancelAudioRecording, revokeLocalResources]);

  useEffect(() => cancelAudioRecording, [cancelAudioRecording]);

  useEffect(() => {
    return () => {
      revokeLocalResources();
    };
  }, [revokeLocalResources]);

  const isUpdatingPost =
    updatePostMutation.isPending || uploadMediaMutation.isPending;

  const handleRequestClose = () => {
    if (isUpdatingPost) return;
    cancelAudioRecording();
    revokeLocalResources();
    resetAiAssistant();
    onClose();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    clearAiUndo();
    if (error) setError(null);
  };

  const handleVisibilityChange = (nextVisibility: PostVisibility) => {
    setVisibility(nextVisibility);
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

      const remainingSlots = Math.max(0, MAX_POST_MEDIA - media.length);
      if (remainingSlots === 0) {
        toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
        return;
      }

      if (validFiles.length > remainingSlots) {
        toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
      }

      const selected = validFiles.slice(0, remainingSlots);
      const addedItems: PostMediaItem[] = selected.map((file, idx) => {
        const id = `edit-local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        pendingFilesRef.current.set(id, file);
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

      setMedia((prev) => [...prev, ...addedItems]);
      setError(null);
    },
    [media.length],
  );

  const handlePickLocalMedia = (
    e: React.ChangeEvent<HTMLInputElement>,
    preferredType?: PostMediaType,
  ) => {
    const files = Array.from(e.target.files ?? []);
    addLocalMediaFiles(files, preferredType);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDraggingMedia(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingMedia(false);
    }
  };

  const handleDropMedia = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDraggingMedia(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    addLocalMediaFiles(files);
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => {
      const target = prev[index];
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
        createdBlobUrlsRef.current.delete(target.url);
      }
      if (target?.id) {
        pendingFilesRef.current.delete(target.id);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const startAudioRecording = async () => {
    if (isRecordingAudio) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.warning('Trình duyệt của bạn chưa hỗ trợ ghi âm.');
      return;
    }
    if (media.length >= MAX_POST_MEDIA) {
      toast.warning('Mỗi bài viết chỉ đính kèm tối đa 8 ảnh, video hoặc bản ghi âm.');
      return;
    }
    if (media.some((item) => item.type === 'AUDIO')) {
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
        const id = `edit-local-audio-${Date.now()}`;
        pendingFilesRef.current.set(id, file);
        const audioUrl = URL.createObjectURL(file);
        createdBlobUrlsRef.current.add(audioUrl);
        setMedia((prev) => [
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
        setError(null);
      };

      recorder.start();
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

  const handleToggleMentionPicker = () => {
    setIsMentionPickerOpen((prev) => !prev);
  };

  const handleToggleTaggedUser = (friend: FriendContactItem) => {
    const isTagged = taggedUsers.some((user) => user.id === friend.id);
    if (isTagged) {
      setTaggedUsers((prev) => prev.filter((user) => user.id !== friend.id));
      return;
    }
    setTaggedUsers((prev) => [...prev, { id: friend.id, fullName: friend.fullName }]);
    setContent((prev) => `${prev}${prev && !/\s$/.test(prev) ? ' ' : ''}@${friend.fullName} `);
    clearAiUndo();
  };

  const handleRemoveTaggedUser = (userId: string) => {
    setTaggedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleTogglePreview = () => {
    setIsPreviewOpen((prev) => !prev);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    const validation = updatePostSchema.safeParse({
      content,
      visibility,
      media,
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ?? 'Nội dung bài viết chưa hợp lệ',
      );
      return;
    }

    try {
      const pendingFiles = media.map((item) =>
        item.id ? pendingFilesRef.current.get(item.id) : undefined,
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

      await updatePostMutation.mutateAsync({
        postId: post.id,
        content: validation.data.content,
        visibility: validation.data.visibility,
        media: finalMedia,
        taggedUserIds: taggedUsers
          .map((user) => user.id)
          .filter((id) => UUID_V4_PATTERN.test(id)),
      });

      revokeLocalResources();
      resetAiAssistant();
      toast.success('Đã cập nhật bài viết thành công!');
      onClose();
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể cập nhật bài viết lúc này.';
      toast.error(message);
    }
  };

  return {
    post,
    friends,
    displayName:
      post?.author.fullName?.trim() || profileUser?.fullName?.trim() || 'Bạn',
    avatarUrl: post?.author.avatarUrl ?? profileUser?.avatarUrl ?? null,
    content,
    visibility,
    media,
    taggedUsers,
    error,
    isDraggingMedia,
    isMentionPickerOpen,
    isPreviewOpen,
    isRecordingAudio,
    audioRecordingDuration,
    isUpdatingPost,
    ...aiAssistant,
    handleRequestClose,
    handleContentChange,
    handleVisibilityChange,
    handlePickLocalMedia,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDropMedia,
    handleRemoveMedia,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
    handleToggleMentionPicker,
    handleToggleTaggedUser,
    handleRemoveTaggedUser,
    handleTogglePreview,
    handleSubmitEdit,
    handleOpenLightbox: onOpenLightbox,
  };
}
