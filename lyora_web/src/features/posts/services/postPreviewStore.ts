import { TokenStorage, type PaginationMeta } from '@/core';
import type {
  CreatePostPayload,
  PaginatedPostReactionsResult,
  PaginatedPostsResult,
  Post,
  PostAuthor,
  PostComment,
  PostMediaItem,
  PostReactionUser,
  PostReactionsQueryParams,
  PostsQueryParams,
  ReactionBreakdown,
  ReactionType,
} from '../types/post.types';

function makeAvatarSvg(initials: string, bg: string, fg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' rx='60' fill='${bg}'/><text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='sans-serif' font-size='44' font-weight='700'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeSceneSvg(title: string, subtitle: string, bg1: string, bg2: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='600' viewBox='0 0 960 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${bg1}'/><stop offset='100%' stop-color='${bg2}'/></linearGradient></defs><rect width='960' height='600' fill='url(%23g)'/><circle cx='780' cy='140' r='90' fill='${accent}' fill-opacity='0.22'/><path d='M0 440 Q240 340 480 420 T960 390 L960 600 L0 600 Z' fill='${accent}' fill-opacity='0.25'/><path d='M0 490 Q320 420 620 495 T960 470 L960 600 L0 600 Z' fill='#111827' fill-opacity='0.14'/><text x='64' y='110' fill='#111827' font-family='sans-serif' font-size='34' font-weight='700'>${title}</text><text x='64' y='154' fill='#374151' font-family='sans-serif' font-size='20'>${subtitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createEmptyBreakdown(): ReactionBreakdown {
  return {
    LIKE: 0,
    LOVE: 0,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
  };
}

function sumReactions(breakdown: ReactionBreakdown): number {
  return Object.values(breakdown).reduce((sum, count) => sum + count, 0);
}

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const AUTHORS = {
  minhAnh: {
    id: 'preview-user-1',
    fullName: 'Nguyễn Minh Anh',
    email: 'minhanh@lyora.vn',
    avatarUrl: makeAvatarSvg('MA', '#DBEAFE', '#1E40AF'),
  },
  hoangNam: {
    id: 'preview-user-2',
    fullName: 'Trần Hoàng Nam',
    email: 'hoangnam@lyora.vn',
    avatarUrl: makeAvatarSvg('HN', '#DCFCE7', '#15803D'),
  },
  thaoVy: {
    id: 'preview-user-3',
    fullName: 'Lê Thảo Vy',
    email: 'thaovy@lyora.vn',
    avatarUrl: makeAvatarSvg('TV', '#FFE4E6', '#BE123C'),
  },
  quocBao: {
    id: 'preview-user-4',
    fullName: 'Phạm Quốc Bảo',
    email: 'quocbao@lyora.vn',
    avatarUrl: makeAvatarSvg('QB', '#FEF3C7', '#B45309'),
  },
  giaHan: {
    id: 'preview-user-5',
    fullName: 'Võ Gia Hân',
    email: 'giahan@lyora.vn',
    avatarUrl: makeAvatarSvg('GH', '#E0F2FE', '#0369A1'),
  },
} as const;

const INITIAL_PREVIEW_POSTS: Post[] = [
  {
    id: 'post-preview-1',
    author: AUTHORS.minhAnh,
    content:
      'Buổi sáng cuối tuần ở Đà Lạt sương còn giăng nhẹ trên đồi thông. Uống một ly cà phê ấm, đọc vài trang sách và chuẩn bị tinh thần cho tuần mới thật hiệu quả!',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-1',
        type: 'IMAGE',
        url: makeSceneSvg('Đà Lạt 07:15 AM', 'Đồi thông trong sương sớm cuối tuần', '#DBEAFE', '#EFF6FF', '#2563EB'),
        alt: 'Khung cảnh đồi thông Đà Lạt buổi sáng',
      },
    ],
    reactionCount: 48,
    reactionBreakdown: { LIKE: 22, LOVE: 19, HAHA: 2, WOW: 5, SAD: 0, ANGRY: 0 },
    userReaction: 'LOVE',
    commentCount: 2,
    comments: [
      {
        id: 'c-101',
        author: AUTHORS.hoangNam,
        content: 'Nhìn bình yên quá bạn ơi! Cuối tuần này nhóm mình cũng định lên đó.',
        createdAt: minutesAgo(14),
      },
      {
        id: 'c-102',
        author: AUTHORS.thaoVy,
        content: 'Nhớ ghé quán cà phê gần hồ Tuyền Lâm chụp thêm ảnh nhé!',
        createdAt: minutesAgo(8),
      },
    ],
    shareCount: 6,
    bookmarkCount: 14,
    isBookmarked: true,
    createdAt: minutesAgo(25),
  },
  {
    id: 'post-preview-2',
    author: AUTHORS.hoangNam,
    content:
      'Tổng hợp 4 góc làm việc tối giản giúp giữ tập trung cả ngày dài. Mọi người thích góc nào nhất? Mình ưu tiên ánh sáng tự nhiên và bàn gỗ gọn gàng không dây.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-2a',
        type: 'IMAGE',
        url: makeSceneSvg('Góc làm việc #1', 'Ánh sáng cửa sổ buổi sáng', '#E0F2FE', '#F8FAFC', '#0284C7'),
        alt: 'Góc làm việc số 1',
      },
      {
        id: 'm-2b',
        type: 'IMAGE',
        url: makeSceneSvg('Góc làm việc #2', 'Bàn phím cơ và màn hình phụ', '#DBEAFE', '#F3F4F6', '#2563EB'),
        alt: 'Góc làm việc số 2',
      },
      {
        id: 'm-2c',
        type: 'IMAGE',
        url: makeSceneSvg('Góc làm việc #3', 'Không gian đọc tài liệu yên tĩnh', '#DCFCE7', '#F3F4F6', '#16A34A'),
        alt: 'Góc làm việc số 3',
      },
      {
        id: 'm-2d',
        type: 'IMAGE',
        url: makeSceneSvg('Góc làm việc #4', 'Kệ sách và cây xanh trang trí', '#FEF3C7', '#FFFBEB', '#D97706'),
        alt: 'Góc làm việc số 4',
      },
      {
        id: 'm-2e',
        type: 'IMAGE',
        url: makeSceneSvg('Góc làm việc #5', 'Đèn bàn ấm cho buổi tối', '#FFE4E6', '#FFF1F2', '#F43F5E'),
        alt: 'Góc làm việc số 5',
      },
    ],
    reactionCount: 92,
    reactionBreakdown: { LIKE: 51, LOVE: 28, HAHA: 1, WOW: 12, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 3,
    comments: [
      {
        id: 'c-201',
        author: AUTHORS.quocBao,
        content: 'Góc số 1 ánh sáng quá ổn áp luôn.',
        createdAt: minutesAgo(42),
      },
      {
        id: 'c-202',
        author: AUTHORS.giaHan,
        content: 'Mình lưu bài lại để cuối tuần dọn lại bàn làm việc theo mẫu này!',
        createdAt: minutesAgo(36),
      },
      {
        id: 'c-203',
        author: AUTHORS.minhAnh,
        content: 'Cây xanh ở góc số 3 nhìn dễ chịu mắt hẳn.',
        createdAt: minutesAgo(29),
      },
    ],
    shareCount: 19,
    bookmarkCount: 37,
    isBookmarked: false,
    createdAt: minutesAgo(55),
  },
  {
    id: 'post-preview-3',
    author: AUTHORS.thaoVy,
    content:
      'Ghi nhanh đoạn video 30 giây buổi workshop thiết kế sản phẩm cộng đồng Lyora chiều nay. Cảm ơn mọi người đã chia sẻ rất nhiều góc nhìn thực tế về trải nghiệm người dùng!',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-3',
        type: 'VIDEO',
        url: makeSceneSvg('Video Highlight · 00:32', 'Workshop Thiết kế Trải nghiệm Cộng đồng Lyora', '#DBEAFE', '#E0E7FF', '#2563EB'),
        alt: 'Video workshop thiết kế sản phẩm',
      },
    ],
    reactionCount: 64,
    reactionBreakdown: { LIKE: 35, LOVE: 21, HAHA: 0, WOW: 8, SAD: 0, ANGRY: 0 },
    userReaction: 'LIKE',
    commentCount: 1,
    comments: [
      {
        id: 'c-301',
        author: AUTHORS.hoangNam,
        content: 'Hẹn mọi người ở buổi meetup tháng sau nha!',
        createdAt: minutesAgo(75),
      },
    ],
    shareCount: 11,
    bookmarkCount: 21,
    isBookmarked: false,
    createdAt: minutesAgo(95),
  },
  {
    id: 'post-preview-4',
    author: AUTHORS.quocBao,
    content:
      '3 mẹo nhỏ mình rút ra sau 6 tháng tự học chạy bộ 5km mỗi sáng:\n1. Ngủ đủ giấc trước ngày chạy.\n2. Khởi động kỹ khớp cổ chân và đầu gối 5 phút.\n3. Giữ nhịp thở đều, không cần vội tăng tốc tuần đầu tiên.\n\nAi đang duy trì thói quen buổi sáng điểm danh cùng mình nhé!',
    visibility: 'PUBLIC',
    media: [],
    reactionCount: 34,
    reactionBreakdown: { LIKE: 24, LOVE: 8, HAHA: 2, WOW: 0, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 1,
    comments: [
      {
        id: 'c-401',
        author: AUTHORS.giaHan,
        content: 'Mình mới chạy lại được 2 tuần, thấy ngủ ngon hơn hẳn!',
        createdAt: minutesAgo(120),
      },
    ],
    shareCount: 8,
    bookmarkCount: 18,
    isBookmarked: true,
    createdAt: minutesAgo(150),
  },
  {
    id: 'post-preview-5',
    author: AUTHORS.giaHan,
    content:
      'Chiều hoàng hôn bên bến Bạch Đằng và ly trà đào mát lạnh cùng hội bạn thân sau giờ tan làm.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-5a',
        type: 'IMAGE',
        url: makeSceneSvg('Hoàng hôn Bến Bạch Đằng', 'Ánh nắng cuối chiều ven sông', '#FFE4E6', '#FEF3C7', '#F43F5E'),
        alt: 'Hoàng hôn bên sông Sài Gòn',
      },
      {
        id: 'm-5b',
        type: 'IMAGE',
        url: makeSceneSvg('Góc phố đi bộ', 'Nhịp sống buổi tối cuối tuần', '#DBEAFE', '#F3F4F6', '#2563EB'),
        alt: 'Phố đi bộ buổi chiều',
      },
    ],
    reactionCount: 41,
    reactionBreakdown: { LIKE: 19, LOVE: 18, HAHA: 3, WOW: 1, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 0,
    comments: [],
    shareCount: 3,
    bookmarkCount: 5,
    isBookmarked: false,
    createdAt: minutesAgo(210),
  },
  {
    id: 'post-preview-6',
    author: AUTHORS.minhAnh,
    content:
      'Bộ ba bức ảnh chụp film cuộn đầu tay ở Hội An: phố cổ rêu phong, giàn hoa giấy trước hiên nhà và chiếc đèn lồng buổi sớm.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-6a',
        type: 'IMAGE',
        url: makeSceneSvg('Hội An · Phố cổ', 'Tường vàng rêu phong buổi sớm', '#FEF3C7', '#FFFBEB', '#D97706'),
        alt: 'Phố cổ Hội An',
      },
      {
        id: 'm-6b',
        type: 'IMAGE',
        url: makeSceneSvg('Giàn hoa giấy', 'Nắng trưa trước hiên nhà', '#FFE4E6', '#FFF1F2', '#F43F5E'),
        alt: 'Giàn hoa giấy Hội An',
      },
      {
        id: 'm-6c',
        type: 'IMAGE',
        url: makeSceneSvg('Sông Hoài', 'Thuyền gỗ lặng lẽ cuối chiều', '#DBEAFE', '#E0F2FE', '#0284C7'),
        alt: 'Sông Hoài Hội An',
      },
    ],
    reactionCount: 77,
    reactionBreakdown: { LIKE: 30, LOVE: 39, HAHA: 0, WOW: 8, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 1,
    comments: [
      {
        id: 'c-601',
        author: AUTHORS.thaoVy,
        content: 'Màu ảnh dịu mắt quá luôn!',
        createdAt: minutesAgo(260),
      },
    ],
    shareCount: 12,
    bookmarkCount: 29,
    isBookmarked: false,
    createdAt: minutesAgo(310),
  },
  {
    id: 'post-preview-7',
    author: AUTHORS.hoangNam,
    content:
      'Ghi chú riêng tư: Danh sách đầu sách kỹ năng kiến trúc phần mềm & thiết kế giao diện cần đọc hết trong quý này (Clean Architecture, Refactoring UI, Designing Data-Intensive Applications).',
    visibility: 'PRIVATE',
    media: [],
    reactionCount: 1,
    reactionBreakdown: { LIKE: 1, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    userReaction: 'LIKE',
    commentCount: 0,
    comments: [],
    shareCount: 0,
    bookmarkCount: 1,
    isBookmarked: true,
    createdAt: minutesAgo(420),
  },
  {
    id: 'post-preview-8',
    author: AUTHORS.thaoVy,
    content:
      'Cuối tuần vừa rồi có ai thử tự làm bánh tiramisu tại nhà chưa? Công thức ít đường dùng cà phê pha phin Việt Nam thơm bất ngờ luôn!',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-8',
        type: 'IMAGE',
        url: makeSceneSvg('Tiramisu Cà Phê Phin', 'Công thức ít ngọt tại nhà', '#FEF3C7', '#F3F4F6', '#D97706'),
        alt: 'Bánh tiramisu cà phê phin',
      },
    ],
    reactionCount: 53,
    reactionBreakdown: { LIKE: 27, LOVE: 20, HAHA: 4, WOW: 2, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 1,
    comments: [
      {
        id: 'c-801',
        author: AUTHORS.quocBao,
        content: 'Xin công thức chi tiết để cuối tuần thử trổ tài nhé!',
        createdAt: minutesAgo(510),
      },
    ],
    shareCount: 15,
    bookmarkCount: 26,
    isBookmarked: false,
    createdAt: minutesAgo(560),
  },
  {
    id: 'post-preview-9',
    author: AUTHORS.quocBao,
    content:
      'Chuyến đạp xe 35km cung đường ven biển Vũng Tàu lúc bình minh. Gió mát rượi và không khí trong lành tuyệt đối.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-9',
        type: 'IMAGE',
        url: makeSceneSvg('Bình minh biển Vũng Tàu', 'Cung đường đạp xe 35km buổi sáng', '#E0F2FE', '#DBEAFE', '#0284C7'),
        alt: 'Bình minh ven biển',
      },
    ],
    reactionCount: 39,
    reactionBreakdown: { LIKE: 25, LOVE: 10, HAHA: 0, WOW: 4, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 0,
    comments: [],
    shareCount: 4,
    bookmarkCount: 7,
    isBookmarked: false,
    createdAt: minutesAgo(720),
  },
  {
    id: 'post-preview-10',
    author: AUTHORS.giaHan,
    content:
      'Chia sẻ nhỏ cho các bạn mới học thiết kế UI: hãy ưu tiên khoảng thở, độ tương phản chữ và phân cấp thông tin trước khi nghĩ đến hiệu ứng trang trí.',
    visibility: 'PUBLIC',
    media: [],
    reactionCount: 68,
    reactionBreakdown: { LIKE: 41, LOVE: 21, HAHA: 0, WOW: 6, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 1,
    comments: [
      {
        id: 'c-1001',
        author: AUTHORS.minhAnh,
        content: 'Chuẩn luôn, ít mà tinh gọn bao giờ cũng dễ dùng hơn.',
        createdAt: minutesAgo(890),
      },
    ],
    shareCount: 22,
    bookmarkCount: 41,
    isBookmarked: false,
    createdAt: minutesAgo(960),
  },
  {
    id: 'post-preview-11',
    author: AUTHORS.minhAnh,
    content:
      'Một góc thư viện yên tĩnh chiều mưa. Những ngày thời tiết mát mẻ như thế này rất hợp để ngồi tổng kết lại mục tiêu tháng.',
    visibility: 'PUBLIC',
    media: [
      {
        id: 'm-11',
        type: 'IMAGE',
        url: makeSceneSvg('Thư viện chiều mưa', 'Không gian yên tĩnh đọc sách', '#DBEAFE', '#F3F4F6', '#1D4ED8'),
        alt: 'Thư viện buổi chiều',
      },
    ],
    reactionCount: 29,
    reactionBreakdown: { LIKE: 18, LOVE: 9, HAHA: 0, WOW: 2, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 0,
    comments: [],
    shareCount: 2,
    bookmarkCount: 9,
    isBookmarked: false,
    createdAt: minutesAgo(1280),
  },
  {
    id: 'post-preview-12',
    author: AUTHORS.hoangNam,
    content:
      'Chúc cộng đồng Lyora một tuần mới nhiều năng lượng tích cực, kết nối chân thành và thật nhiều ý tưởng hay được chia sẻ!',
    visibility: 'PUBLIC',
    media: [],
    reactionCount: 45,
    reactionBreakdown: { LIKE: 30, LOVE: 15, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    userReaction: null,
    commentCount: 0,
    comments: [],
    shareCount: 5,
    bookmarkCount: 4,
    isBookmarked: false,
    createdAt: minutesAgo(1440),
  },
];

function resolveCurrentAuthor(): PostAuthor {
  const currentUser = TokenStorage.getUser();
  if (currentUser) {
    return {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      avatarUrl: currentUser.avatarUrl ?? null,
    };
  }
  return {
    id: 'current-client-user',
    fullName: 'Người Dùng Lyora',
    email: 'user@gmail.com',
    avatarUrl: makeAvatarSvg('ND', '#DBEAFE', '#1E40AF'),
  };
}

const EXTRA_REACTOR_PROFILES: PostAuthor[] = [
  AUTHORS.minhAnh,
  AUTHORS.hoangNam,
  AUTHORS.thaoVy,
  AUTHORS.quocBao,
  AUTHORS.giaHan,
  { id: 'react-u-6', fullName: 'Đặng Xuân Huy', avatarUrl: makeAvatarSvg('XH', '#E0E7FF', '#3730A3') },
  { id: 'react-u-7', fullName: 'Hoàng Đình Vũ', avatarUrl: makeAvatarSvg('ĐV', '#DCFCE7', '#166534') },
  { id: 'react-u-8', fullName: 'Bùi Thanh Trúc', avatarUrl: makeAvatarSvg('TT', '#FCE7F3', '#9D174D') },
  { id: 'react-u-9', fullName: 'Ngô Minh Khôi', avatarUrl: makeAvatarSvg('MK', '#FEF3C7', '#92400E') },
  { id: 'react-u-10', fullName: 'Lý Ngọc Diệp', avatarUrl: makeAvatarSvg('ND', '#DBEAFE', '#1D4ED8') },
  { id: 'react-u-11', fullName: 'Trương Tuấn Kiệt', avatarUrl: makeAvatarSvg('TK', '#F3E8FF', '#6B21A8') },
  { id: 'react-u-12', fullName: 'Đỗ Phương Linh', avatarUrl: makeAvatarSvg('PL', '#FFE4E6', '#BE123C') },
  { id: 'react-u-13', fullName: 'Huỳnh Khang Điền', avatarUrl: makeAvatarSvg('KĐ', '#E0F2FE', '#0369A1') },
  { id: 'react-u-14', fullName: 'Dương Tấn Phát', avatarUrl: makeAvatarSvg('TP', '#DCFCE7', '#15803D') },
  { id: 'react-u-15', fullName: 'Võ Lan Uyên', avatarUrl: makeAvatarSvg('LU', '#FEF3C7', '#B45309') },
];

class PostPreviewStore {
  private posts: Post[] = structuredClone(INITIAL_PREVIEW_POSTS);
  private hiddenPostIds = new Set<string>();

  getFriends(): PostAuthor[] {
    const currentUser = resolveCurrentAuthor();
    return Object.values(AUTHORS)
      .filter(
        (author) =>
          author.id !== currentUser.id && author.email !== currentUser.email,
      )
      .map((author) => ({ ...author }));
  }

  getPosts(params: PostsQueryParams): PaginatedPostsResult {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 5);
    const search = params.search?.trim().toLowerCase() ?? '';
    const filter = params.filter ?? 'all';
    const currentUser = resolveCurrentAuthor();

    let filtered = this.posts.filter((post) => {
      if (this.hiddenPostIds.has(post.id)) {
        return false;
      }

      const isMine =
        post.author.id === currentUser.id ||
        post.author.email === currentUser.email ||
        (post.id === 'post-preview-7' && filter === 'mine');

      if (post.visibility === 'PRIVATE' && !isMine) {
        return false;
      }

      if (filter === 'mine' && !isMine) {
        return false;
      }

      if (filter === 'saved' && !post.isBookmarked) {
        return false;
      }

      if (params.visibility && post.visibility !== params.visibility) {
        return false;
      }

      if (search) {
        const matchContent = post.content.toLowerCase().includes(search);
        const matchAuthor = post.author.fullName.toLowerCase().includes(search);
        return matchContent || matchAuthor;
      }

      return true;
    });

    filtered = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((item) => structuredClone(item));

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items,
      meta,
      isPreviewFallback: true,
    };
  }

  createPost(payload: CreatePostPayload): Post {
    const author = resolveCurrentAuthor();
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author,
      content: payload.content.trim(),
      visibility: payload.visibility,
      media: (payload.media ?? []).map((item, idx) => ({
        ...item,
        id: item.id || `media-${Date.now()}-${idx}`,
      })),
      reactionCount: 0,
      reactionBreakdown: createEmptyBreakdown(),
      userReaction: null,
      commentCount: 0,
      comments: [],
      shareCount: 0,
      bookmarkCount: 0,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
    };

    this.posts = [newPost, ...this.posts];
    return structuredClone(newPost);
  }

  reactPost(postId: string, reactionType: ReactionType): Post {
    const target = this.posts.find((p) => p.id === postId);
    if (!target) {
      throw new Error('Không tìm thấy bài viết');
    }

    const breakdown: ReactionBreakdown = { ...target.reactionBreakdown };
    if (target.userReaction === reactionType) {
      breakdown[reactionType] = Math.max(0, (breakdown[reactionType] ?? 0) - 1);
      target.userReaction = null;
    } else {
      if (target.userReaction) {
        breakdown[target.userReaction] = Math.max(
          0,
          (breakdown[target.userReaction] ?? 0) - 1,
        );
      }
      breakdown[reactionType] = (breakdown[reactionType] ?? 0) + 1;
      target.userReaction = reactionType;
    }

    target.reactionBreakdown = breakdown;
    target.reactionCount = sumReactions(breakdown);
    return structuredClone(target);
  }

  toggleBookmark(postId: string): Post {
    const target = this.posts.find((p) => p.id === postId);
    if (!target) {
      throw new Error('Không tìm thấy bài viết');
    }

    target.isBookmarked = !target.isBookmarked;
    target.bookmarkCount = Math.max(0, target.bookmarkCount + (target.isBookmarked ? 1 : -1));
    return structuredClone(target);
  }

  sharePost(postId: string): Post {
    const target = this.posts.find((p) => p.id === postId);
    if (!target) {
      throw new Error('Không tìm thấy bài viết');
    }

    target.shareCount += 1;
    return structuredClone(target);
  }

  hidePost(postId: string): { hidden: boolean } {
    this.hiddenPostIds.add(postId);
    return { hidden: true };
  }

  unhidePost(postId: string): { hidden: boolean } {
    this.hiddenPostIds.delete(postId);
    return { hidden: false };
  }

  getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): PaginatedPostReactionsResult {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      return {
        items: [],
        meta: {
          page: 1,
          limit: params.limit ?? 6,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        breakdown: createEmptyBreakdown(),
        isPreviewFallback: true,
      };
    }

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const reactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
    const allReactors: PostReactionUser[] = [];
    const currentUser = resolveCurrentAuthor();

    if (post.userReaction && (!params.reactionType || params.reactionType === post.userReaction)) {
      allReactors.push({
        id: `${postId}-react-self`,
        user: currentUser,
        reactionType: post.userReaction,
        createdAt: minutesAgo(2),
      });
    }

    const remainingByType: Record<ReactionType, number> = {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
    };

    for (const rType of reactionTypes) {
      if (params.reactionType && params.reactionType !== rType) continue;
      let countForType = post.reactionBreakdown[rType] ?? 0;
      if (post.userReaction === rType && countForType > 0) {
        countForType -= 1;
      }
      remainingByType[rType] = countForType;
    }

    let globalIdx = 0;
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const rType of reactionTypes) {
        if (remainingByType[rType] > 0) {
          hasMore = true;
          remainingByType[rType] -= 1;
          const baseProfile = EXTRA_REACTOR_PROFILES[globalIdx % EXTRA_REACTOR_PROFILES.length];
          const cycle = Math.floor(globalIdx / EXTRA_REACTOR_PROFILES.length);
          const displayName =
            cycle === 0 ? baseProfile.fullName : `${baseProfile.fullName} #${cycle + 1}`;
          allReactors.push({
            id: `${postId}-react-${rType}-${globalIdx}`,
            user: {
              ...baseProfile,
              id: `${baseProfile.id}-${cycle}`,
              fullName: displayName,
            },
            reactionType: rType,
            createdAt: minutesAgo(5 + globalIdx * 3),
          });
          globalIdx++;
        }
      }
    }

    const totalItems = allReactors.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const start = (page - 1) * limit;
    const items = allReactors.slice(start, start + limit);

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      breakdown: { ...post.reactionBreakdown },
      isPreviewFallback: true,
    };
  }

  addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): PostComment {
    const target = this.posts.find((p) => p.id === postId);
    if (!target) {
      throw new Error('Không tìm thấy bài viết');
    }

    const newComment: PostComment = {
      id: `comment-${Date.now()}`,
      author: resolveCurrentAuthor(),
      content: content.trim(),
      media: media ? { ...media } : null,
      createdAt: new Date().toISOString(),
    };

    target.comments = [...target.comments, newComment];
    target.commentCount = target.comments.length;
    return structuredClone(newComment);
  }
}

export const postPreviewStore = new PostPreviewStore();
