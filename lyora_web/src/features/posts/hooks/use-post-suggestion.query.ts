import { useMutation } from '@tanstack/react-query';
import { postService } from '../services/post.service';
import type {
  PostSuggestionsResult,
  SuggestPostContentPayload,
} from '../types/post.types';

export function useSuggestPostContentMutation() {
  return useMutation<PostSuggestionsResult, unknown, SuggestPostContentPayload>({
    mutationFn: (payload: SuggestPostContentPayload) =>
      postService.suggestContent(payload),
  });
}
