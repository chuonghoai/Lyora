import { useCallback, useState } from 'react';
import { isApiError } from '@/core';
import {
  suggestPostContentSchema,
  useSuggestPostContentMutation,
  type PostContentSuggestion,
  type PostSuggestionTone,
} from '@/features/posts';

export interface UsePostAiAssistantParams {
  composerContent: string;
  setComposerContent: React.Dispatch<React.SetStateAction<string>>;
  onClearComposerError?: () => void;
}

export function usePostAiAssistant({
  composerContent,
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

  const handleToggleAiPanel = () => {
    setIsAiPanelOpen((prev) => !prev);
    setAiError(null);
  };

  const handleAiTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiTopic(e.target.value);
    if (aiError) setAiError(null);
  };

  const handleAiToneChange = (tone: PostSuggestionTone) => {
    setAiTone(tone);
    if (aiError) setAiError(null);
  };

  const handleRequestAiSuggestions = async () => {
    const validation = suggestPostContentSchema.safeParse({
      topic: aiTopic,
      currentContent: composerContent,
      tone: aiTone,
    });

    if (!validation.success) {
      setAiError(
        validation.error.issues[0]?.message ??
          'Vui lòng nhập ý chính hoặc viết vài dòng để AI gợi ý',
      );
      return;
    }

    setAiError(null);
    try {
      const result = await suggestMutation.mutateAsync({
        tone: validation.data.tone,
        ...(validation.data.topic ? { topic: validation.data.topic } : {}),
        ...(validation.data.currentContent
          ? { currentContent: validation.data.currentContent }
          : {}),
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
    suggestMutation.reset();
  }, [suggestMutation]);

  return {
    isAiPanelOpen,
    aiTopic,
    aiTone,
    aiSuggestions,
    isGeneratingAi: suggestMutation.isPending,
    aiError,
    canUndoAiApply: aiPreviousContent !== null,
    handleToggleAiPanel,
    handleAiTopicChange,
    handleAiToneChange,
    handleRequestAiSuggestions,
    handleApplyAiSuggestion,
    handleUndoAiApply,
    clearAiUndo,
    resetAiAssistant,
  };
}
