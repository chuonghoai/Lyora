import { PostMediaType } from '../enums/post.enums';

export interface PostMediaItem {
  id: string;
  type: PostMediaType;
  url: string;
  alt?: string;
  duration?: number;
  fileName?: string;
  size?: number;
}

export interface CloudinaryResponse {
  url: string;
  publicId: string;
  duration?: number;
  format?: string;
  size: number;
}
