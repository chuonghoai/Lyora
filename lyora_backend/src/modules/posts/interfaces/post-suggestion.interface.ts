import { PostSuggestionTone } from '../dto/suggest-post-content.dto';

export interface PostContentSuggestion {
  id: string;
  content: string;
}

export interface PostSuggestionsResponse {
  tone: PostSuggestionTone;
  suggestions: PostContentSuggestion[];
}
