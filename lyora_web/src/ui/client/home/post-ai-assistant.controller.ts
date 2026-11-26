import { useCallback, useMemo, useState } from 'react';
import { isApiError } from '@/core';
import {
  suggestPostContentSchema,
  useSuggestPostContentMutation,
  type PostContentSuggestion,
  type PostMediaItem,
  type PostSuggestionTone,
  type PostVisibility,
  type SuggestPostMediaContextItem,
} from '@/features/posts';

const MAX_AI_INLINE_MEDIA_BYTES = 18 * 1024 * 1024;

const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  PUBLIC: 'Công khai',
  FRIENDS: 'Bạn bè',
  PRIVATE: 'Riêng tư',
};

export interface AiTaggedUserInfo {
  id: string;
  fullName: string;
}

export interface AiComposerContextInfo {
  hasComposerContent: boolean;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  taggedUserNames: string[];
  visibilityLabel: string;
  oversizedMediaCount: number;
}

export interface UsePostAiAssistantParams {
  composerContent: string;
  composerVisibility: PostVisibility;
  composerMedia: PostMediaItem[];
  composerTaggedUsers: AiTaggedUserInfo[];
  getComposerMediaFiles: () => File[];
  setComposerContent: React.Dispatch<React.SetStateAction<string>>;
  onClearComposerError?: () => void;
}

export function usePostAiAssistant({
  composerContent,
  composerVisibility,
  composerMedia,
  composerTaggedUsers,
  getComposerMediaFiles,
  setComposerContent,
  onClearComposerError,
}: UsePostAiAssistantParams) {
  const suggestMutation = useSuggestPostContentMutation();

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<PostSuggestionTone>('FRIENDLY');
  const [aiSuggestions, setAiSuggestions] = useState<PostContentSuggestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreviousContent, setAiPreviousContent] = useState<string | null>(null);
  const [oversizedMediaCount, setOversizedMediaCount] = useState(0);

  const aiContextInfo = useMemo<AiComposerContextInfo>(() => {
    let imageCount = 0;
    let videoCount = 0;
    let audioCount = 0;

    for (const item of composerMedia) {
      if (item.type === 'IMAGE') imageCount += 1;
      else if (item.type === 'VIDEO') videoCount += 1;
      else if (item.type === 'AUDIO') audioCount += 1;
    }

    return {
      hasComposerContent: composerContent.trim().length > 0,
      imageCount,
      videoCount,
      audioCount,
      taggedUserNames: composerTaggedUsers
        .map((user) => user.fullName.trim())
        .filter(Boolean),
      visibilityLabel: VISIBILITY_LABELS[composerVisibility],
      oversizedMediaCount,
    };
  }, [
    composerContent,
    composerMedia,
    composerTaggedUsers,
    composerVisibility,
    oversizedMediaCount,
  ]);

  const handleToggleAiPanel = () => {
    setIsAiPanelOpen((prev) => !prev);
    setAiError(null);
  };

  const handleAiTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiTopic(e.target.value);
    if (aiError) setAiError(null);
  };

  const handleAiToneChange = (tone: PostSuggestionTone) => {
    setAiTone(tone);
    if (aiError) setAiError(null);
  };

  const handleRequestAiSuggestions = async () => {
    const rawFiles = getComposerMediaFiles();
    const selectedFiles: File[] = [];
    let totalBytes = 0;
    let skippedCount = 0;

    for (const file of rawFiles) {
      if (totalBytes + file.size <= MAX_AI_INLINE_MEDIA_BYTES) {
        totalBytes += file.size;
        selectedFiles.push(file);
      } else {
        skippedCount += 1;
      }
    }
    setOversizedMediaCount(skippedCount);

    const mediaItems: SuggestPostMediaContextItem[] = composerMedia.map((item) => ({
      type: item.type,
      ...(item.fileName?.trim() ? { fileName: item.fileName.trim() } : {}),
      ...(item.alt?.trim() ? { alt: item.alt.trim() } : {}),
      ...(typeof item.duration === 'number' ? { duration: item.duration } : {}),
    }));

    const taggedUserNames = composerTaggedUsers
      .map((user) => user.fullName.trim())
      .filter(Boolean);

    const validation = suggestPostContentSchema.safeParse({
      topic: aiTopic,
      currentContent: composerContent,
      tone: aiTone,
      visibility: composerVisibility,
      ...(taggedUserNames.length > 0 ? { taggedUserNames } : {}),
      ...(mediaItems.length > 0 ? { mediaItems } : {}),
      ...(selectedFiles.length > 0 ? { mediaFiles: selectedFiles } : {}),
    });

    if (!validation.success) {
      setAiError(
        validation.error.issues[0]?.message ??
          'Vui lòng nhập ý chính, viết vài dòng hoặc đính kèm ảnh/video/ghi âm để AI gợi ý',
      );
      return;
    }

    setAiError(null);
    try {
      const result = await suggestMutation.mutateAsync({
        tone: validation.data.tone,
        visibility: validation.data.visibility,
        ...(validation.data.topic ? { topic: validation.data.topic } : {}),
        ...(validation.data.currentContent
          ? { currentContent: validation.data.currentContent }
          : {}),
        ...(taggedUserNames.length > 0 ? { taggedUserNames } : {}),
        ...(mediaItems.length > 0 ? { mediaItems } : {}),
        ...(selectedFiles.length > 0 ? { mediaFiles: selectedFiles } : {}),
      });
      setAiSuggestions(result.suggestions);
    } catch (err) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error && err.message
          ? err.message
          : 'Không thể tạo gợi ý lúc này, vui lòng thử lại.';
      setAiError(message);
    }
  };

  const handleAiTopicKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleRequestAiSuggestions();
    }
  };

  const handleApplyAiSuggestion = (suggestionId: string) => {
    const selected = aiSuggestions.find((item) => item.id === suggestionId);
    if (!selected) return;

    setAiPreviousContent((prev) => (prev === null ? composerContent : prev));
    setComposerContent(selected.content);
    onClearComposerError?.();
  };

  const handleUndoAiApply = () => {
    if (aiPreviousContent === null) return;
    setComposerContent(aiPreviousContent);
    setAiPreviousContent(null);
  };

  const clearAiUndo = useCallback(() => {
    setAiPreviousContent(null);
  }, []);

  const resetAiAssistant = useCallback(() => {
    setIsAiPanelOpen(false);
    setAiTopic('');
    setAiTone('FRIENDLY');
    setAiSuggestions([]);
    setAiError(null);
    setAiPreviousContent(null);
    setOversizedMediaCount(0);
    suggestMutation.reset();
  }, [suggestMutation]);

  return {
    isAiPanelOpen,
    aiTopic,
    aiTone,
    aiSuggestions,
    aiContextInfo,
    isGeneratingAi: suggestMutation.isPending,
    aiError,
    canUndoAiApply: aiPreviousContent !== null,
    handleToggleAiPanel,
    handleAiTopicChange,
    handleAiTopicKeyDown,
    handleAiToneChange,
    handleRequestAiSuggestions,
    handleApplyAiSuggestion,
    handleUndoAiApply,
    clearAiUndo,
    resetAiAssistant,
  };
}
