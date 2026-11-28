import { describe, expect, it } from 'vitest';
import type { Post } from '@/features/posts';
import { isClientProfilePathname, ROUTES } from '@/routes/paths';
import {
  extractPostAuxiliaryMedia,
  extractPostVideos,
  formatVideoDuration,
  getNextClipIndex,
  mergeFocusedVideoPost,
} from '@/ui/client/videos/videos.controller';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    author: {
      id: 'user-1',
      fullName: 'Trịnh Đại Nghĩa',
      avatarUrl: null,
    },
    content: 'Video cộng đồng Lyora',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'vid-1',
        type: 'VIDEO',
        url: 'https://res.cloudinary.com/demo/video/upload/v1/clip1.mp4',
        duration: 42,
      },
    ],
    reactionCount: 0,
    reactionBreakdown: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 0,
    comments: [],
    shareCount: 0,
    bookmarkCount: 0,
    isBookmarked: false,
    createdAt: '2026-11-28T10:00:00.000Z',
    ...overrides,
  };
}

describe('Videos Feature Helpers & Routing', () => {
  it('đăng ký route /videos là đường dẫn dành riêng và không bị nhận nhầm là trang hồ sơ', () => {
    expect(ROUTES.CLIENT.VIDEOS).toBe('/videos');
    expect(isClientProfilePathname('/videos')).toBe(false);
    expect(isClientProfilePathname('/user-123')).toBe(true);
  });

  it('tách chính xác danh sách video và phương tiện đi kèm (ảnh, ghi âm) trong bài viết hỗn hợp', () => {
    const mixedPost = makePost({
      media: [
        { id: 'img-1', type: 'IMAGE', url: 'https://res.cloudinary.com/demo/image/upload/a.jpg' },
        { id: 'vid-1', type: 'VIDEO', url: 'https://res.cloudinary.com/demo/video/upload/1.mp4' },
        { id: 'aud-1', type: 'AUDIO', url: 'https://res.cloudinary.com/demo/video/upload/voice.webm' },
        { id: 'vid-2', type: 'VIDEO', url: 'https://res.cloudinary.com/demo/video/upload/2.mp4' },
      ],
    });

    const videos = extractPostVideos(mixedPost);
    const aux = extractPostAuxiliaryMedia(mixedPost);

    expect(videos).toHaveLength(2);
    expect(videos.map((v) => v.id)).toEqual(['vid-1', 'vid-2']);
    expect(aux.images).toHaveLength(1);
    expect(aux.audios).toHaveLength(1);
  });

  it('chuyển vòng chỉ số clip trái/phải mượt mà khi bài đăng có từ 2 video trở lên', () => {
    expect(getNextClipIndex(0, 3, 'next')).toBe(1);
    expect(getNextClipIndex(2, 3, 'next')).toBe(0);
    expect(getNextClipIndex(0, 3, 'prev')).toBe(2);
    expect(getNextClipIndex(1, 2, 'prev')).toBe(0);
    expect(getNextClipIndex(0, 1, 'next')).toBe(0);
  });

  it('định dạng thời lượng video mm:ss và bỏ qua giá trị không hợp lệ', () => {
    expect(formatVideoDuration(0)).toBeNull();
    expect(formatVideoDuration(undefined)).toBeNull();
    expect(formatVideoDuration(9)).toBe('0:09');
    expect(formatVideoDuration(125.4)).toBe('2:05');
  });

  it('ghép bài deep-link có video lên đầu nếu chưa có trong feed và bỏ qua bài không có video', () => {
    const p1 = makePost({ id: 'post-1' });
    const p2 = makePost({ id: 'post-2' });
    const textOnly = makePost({ id: 'post-text', media: [] });

    expect(mergeFocusedVideoPost([p1, textOnly], p2).map((p) => p.id)).toEqual([
      'post-2',
      'post-1',
    ]);
    // Không trùng lặp nếu deep-link đã nằm trong feed
    expect(mergeFocusedVideoPost([p1, p2], p2).map((p) => p.id)).toEqual([
      'post-1',
      'post-2',
    ]);
    // Bỏ qua deep-link không có video
    expect(mergeFocusedVideoPost([p1], textOnly).map((p) => p.id)).toEqual(['post-1']);
  });
});
