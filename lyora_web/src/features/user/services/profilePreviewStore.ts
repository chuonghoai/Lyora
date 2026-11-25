import { localStorageService, TokenStorage, type UserProfile } from '@/core';
import type {
  ProfileActivityFeed,
  ProfileActivityItem,
  ProfileCoverPreset,
  ProfileFriendSummary,
  ProfileFriendsDirectory,
  ProfileFriendshipStatus,
  PublicUserProfile,
  UpdateExtendedProfilePayload,
} from '../types/user.types';

const PROFILE_EXTRAS_STORAGE_KEY = 'lyora:profile-preview-extras';

function makeAvatarSvg(initials: string, bg: string, fg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><rect width='160' height='160' rx='80' fill='${bg}'/><text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='sans-serif' font-size='54' font-weight='700'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Ảnh bìa phẳng theo đúng bảng màu Clean & Trustworthy (không sử dụng gradient).
 */
function makeArchitecturalCoverSvg(
  baseBg: string,
  bandOne: string,
  bandTwo: string,
  accent: string,
): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='360' viewBox='0 0 1200 360' preserveAspectRatio='xMidYMid slice'><rect width='1200' height='360' fill='${baseBg}'/><path d='M0 245 Q280 185 590 235 T1200 205 L1200 360 L0 360 Z' fill='${bandOne}'/><path d='M0 290 Q360 240 720 295 T1200 265 L1200 360 L0 360 Z' fill='${bandTwo}'/><circle cx='1010' cy='96' r='52' fill='${accent}' fill-opacity='0.14'/><circle cx='1010' cy='96' r='28' fill='${accent}' fill-opacity='0.22'/><rect x='82' y='64' width='84' height='10' rx='5' fill='${accent}' fill-opacity='0.22'/><rect x='82' y='86' width='52' height='8' rx='4' fill='${accent}' fill-opacity='0.14'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeActivitySceneSvg(title: string, subtitle: string, bg: string, wave: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='880' height='420' viewBox='0 0 880 420'><rect width='880' height='420' fill='${bg}'/><path d='M0 300 Q240 230 500 290 T880 260 L880 420 L0 420 Z' fill='${wave}'/><circle cx='740' cy='110' r='54' fill='${accent}' fill-opacity='0.18'/><text x='48' y='96' fill='#111827' font-family='sans-serif' font-size='28' font-weight='700'>${title}</text><text x='48' y='136' fill='#374151' font-family='sans-serif' font-size='18'>${subtitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const PROFILE_COVER_PRESETS: readonly ProfileCoverPreset[] = [
  {
    id: 'lyora-blue',
    label: 'Xanh Lyora',
    url: makeArchitecturalCoverSvg('#EFF6FF', '#DBEAFE', '#93C5FD', '#2563EB'),
  },
  {
    id: 'morning-sky',
    label: 'Sương sớm',
    url: makeArchitecturalCoverSvg('#F3F4F6', '#E0F2FE', '#BAE6FD', '#0284C7'),
  },
  {
    id: 'calm-mint',
    label: 'Dịu mắt',
    url: makeArchitecturalCoverSvg('#F3F4F6', '#DCFCE7', '#DBEAFE', '#16A34A'),
  },
] as const;

interface StoredProfileExtras {
  fullName?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

interface CommunityMemberSeed {
  id: string;
  fullName: string;
  bio: string;
  location: string;
  hometown: string;
  workplace: string;
  education: string;
  website: string;
  avatarUrl: string;
  coverUrl: string;
  isOnline: boolean;
  createdAt: string;
  friendshipStatus: Exclude<ProfileFriendshipStatus, 'SELF'>;
  friendIds: string[];
}

const COMMUNITY_MEMBERS_SEED: readonly CommunityMemberSeed[] = [
  {
    id: 'preview-user-1',
    fullName: 'Nguyễn Minh Anh',
    bio: 'Yêu nhiếp ảnh film, cà phê sáng Đà Lạt và những cuộc trò chuyện chân thành.',
    location: 'TP. Hồ Chí Minh',
    hometown: 'Đà Lạt, Lâm Đồng',
    workplace: 'Product Designer tại Lyora Studio',
    education: 'Đại học Kiến trúc TP.HCM',
    website: 'https://minhanh.lyora.vn',
    avatarUrl: makeAvatarSvg('MA', '#DBEAFE', '#1E40AF'),
    coverUrl: PROFILE_COVER_PRESETS[0].url,
    isOnline: true,
    createdAt: '2025-03-14T08:30:00.000Z',
    friendshipStatus: 'FRIEND',
    friendIds: ['me', 'preview-user-2', 'preview-user-3', 'preview-user-5', 'preview-user-6'],
  },
  {
    id: 'preview-user-2',
    fullName: 'Trần Hoàng Nam',
    bio: 'Kỹ sư phần mềm yêu thích không gian làm việc tối giản và chia sẻ kiến thức hệ thống.',
    location: 'Hà Nội',
    hometown: 'Hải Phòng',
    workplace: 'Backend Architect tại FinCore',
    education: 'Đại học Bách Khoa Hà Nội',
    website: 'https://hoangnam.dev',
    avatarUrl: makeAvatarSvg('HN', '#DCFCE7', '#15803D'),
    coverUrl: PROFILE_COVER_PRESETS[1].url,
    isOnline: true,
    createdAt: '2025-04-02T09:15:00.000Z',
    friendshipStatus: 'FRIEND',
    friendIds: ['me', 'preview-user-1', 'preview-user-3', 'preview-user-4', 'preview-user-7'],
  },
  {
    id: 'preview-user-3',
    fullName: 'Lê Thảo Vy',
    bio: 'Tổ chức workshop thiết kế cộng đồng & thích tự làm bánh vào cuối tuần.',
    location: 'TP. Hồ Chí Minh',
    hometown: 'Huế',
    workplace: 'UX Lead tại Creative Hub',
    education: 'Đại học RMIT Việt Nam',
    website: 'https://thaovy.design',
    avatarUrl: makeAvatarSvg('TV', '#FFE4E6', '#BE123C'),
    coverUrl: PROFILE_COVER_PRESETS[2].url,
    isOnline: true,
    createdAt: '2025-05-19T14:20:00.000Z',
    friendshipStatus: 'FRIEND',
    friendIds: ['me', 'preview-user-1', 'preview-user-2', 'preview-user-5'],
  },
  {
    id: 'preview-user-4',
    fullName: 'Phạm Quốc Bảo',
    bio: 'Chạy bộ 5km mỗi sáng, đạp xe ven biển và ghi lại những cung đường đẹp.',
    location: 'Đà Nẵng',
    hometown: 'Quảng Nam',
    workplace: 'Quản lý Dự án Cộng đồng',
    education: 'Đại học Kinh tế Đà Nẵng',
    website: '',
    avatarUrl: makeAvatarSvg('QB', '#FEF3C7', '#B45309'),
    coverUrl: PROFILE_COVER_PRESETS[0].url,
    isOnline: false,
    createdAt: '2025-06-08T06:45:00.000Z',
    friendshipStatus: 'FRIEND',
    friendIds: ['me', 'preview-user-2', 'preview-user-8'],
  },
  {
    id: 'preview-user-5',
    fullName: 'Võ Gia Hân',
    bio: 'Thiết kế giao diện gọn gàng, thích trà đào hoàng hôn và sách về tâm lý học.',
    location: 'TP. Hồ Chí Minh',
    hometown: 'Cần Thơ',
    workplace: 'UI Specialist tại Nền tảng Số',
    education: 'Đại học Khoa học Tự nhiên',
    website: 'https://giahan.studio',
    avatarUrl: makeAvatarSvg('GH', '#E0F2FE', '#0369A1'),
    coverUrl: PROFILE_COVER_PRESETS[1].url,
    isOnline: true,
    createdAt: '2025-07-21T11:00:00.000Z',
    friendshipStatus: 'FRIEND',
    friendIds: ['me', 'preview-user-1', 'preview-user-3', 'preview-user-6'],
  },
  {
    id: 'preview-user-6',
    fullName: 'Đặng Xuân Huy',
    bio: 'Quan tâm đến công nghệ web, nhiếp ảnh đường phố và các câu lạc bộ đọc sách.',
    location: 'TP. Hồ Chí Minh',
    hometown: 'Biên Hòa, Đồng Nai',
    workplace: 'Frontend Engineer tại CloudViet',
    education: 'Đại học Sư phạm Kỹ thuật TP.HCM',
    website: '',
    avatarUrl: makeAvatarSvg('XH', '#DBEAFE', '#1D4ED8'),
    coverUrl: PROFILE_COVER_PRESETS[2].url,
    isOnline: true,
    createdAt: '2025-09-11T16:10:00.000Z',
    friendshipStatus: 'REQUEST_RECEIVED',
    friendIds: ['preview-user-1', 'preview-user-5', 'preview-user-7'],
  },
  {
    id: 'preview-user-7',
    fullName: 'Bùi Thanh Trúc',
    bio: 'Biên tập viên nội dung số, thích du lịch chậm và khám phá ẩm thực địa phương.',
    location: 'Hà Nội',
    hometown: 'Nam Định',
    workplace: 'Content Strategist tại OpenMedia',
    education: 'Học viện Báo chí và Tuyên truyền',
    website: '',
    avatarUrl: makeAvatarSvg('TT', '#FCE7F3', '#9D174D'),
    coverUrl: PROFILE_COVER_PRESETS[0].url,
    isOnline: false,
    createdAt: '2025-10-03T10:05:00.000Z',
    friendshipStatus: 'REQUEST_SENT',
    friendIds: ['preview-user-2', 'preview-user-6'],
  },
  {
    id: 'preview-user-8',
    fullName: 'Ngô Minh Khôi',
    bio: 'Đam mê âm nhạc acoustic và chia sẻ trải nghiệm xây dựng thói quen đọc mỗi ngày.',
    location: 'Đà Nẵng',
    hometown: 'Quy Nhơn, Bình Định',
    workplace: 'Chuyên viên Phân tích Dữ liệu',
    education: 'Đại học Bách Khoa Đà Nẵng',
    website: '',
    avatarUrl: makeAvatarSvg('MK', '#FEF3C7', '#92400E'),
    coverUrl: PROFILE_COVER_PRESETS[1].url,
    isOnline: true,
    createdAt: '2026-01-12T08:00:00.000Z',
    friendshipStatus: 'NONE',
    friendIds: ['preview-user-4', 'preview-user-2'],
  },
];

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LY';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function resolveCurrentBaseUser(): UserProfile {
  const stored = TokenStorage.getUser();
  if (stored) {
    return stored;
  }
  return {
    id: 'current-client-user',
    email: 'thanhvien@lyora.vn',
    fullName: 'Thành viên Lyora',
    role: 'CLIENT',
    phoneNumber: '0908123456',
    bio: 'Chia sẻ khoảnh khắc đời thường, kết nối bạn bè và lưu giữ những câu chuyện tích cực cùng cộng đồng Lyora.',
    location: 'TP. Hồ Chí Minh',
    avatarUrl: null,
    isActive: true,
    createdAt: '2025-02-10T07:00:00.000Z',
  };
}

class ProfilePreviewStore {
  private members: Map<string, CommunityMemberSeed> = new Map();
  private runtimeExtraFriendIds: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.members.clear();
    this.runtimeExtraFriendIds.clear();
    for (const seed of COMMUNITY_MEMBERS_SEED) {
      this.members.set(seed.id, { ...seed, friendIds: [...seed.friendIds] });
    }
  }

  private readExtras(): StoredProfileExtras {
    return localStorageService.getItem<StoredProfileExtras>(PROFILE_EXTRAS_STORAGE_KEY) ?? {};
  }

  private writeExtras(extras: StoredProfileExtras): void {
    localStorageService.setItem(PROFILE_EXTRAS_STORAGE_KEY, extras);
  }

  private getMyFriendIds(): string[] {
    const ids: string[] = [];
    for (const member of this.members.values()) {
      if (member.friendshipStatus === 'FRIEND') {
        ids.push(member.id);
      }
    }
    return ids;
  }

  private computeMutualCount(targetMember: CommunityMemberSeed): number {
    const myFriends = new Set(this.getMyFriendIds());
    return targetMember.friendIds.filter((id) => id !== 'me' && myFriends.has(id)).length;
  }

  private toFriendSummary(member: CommunityMemberSeed): ProfileFriendSummary {
    return {
      id: member.id,
      fullName: member.fullName,
      avatarUrl: member.avatarUrl,
      headline: member.workplace || member.bio,
      location: member.location,
      mutualFriendsCount: this.computeMutualCount(member),
      friendshipStatus: member.friendshipStatus,
      isOnline: member.isOnline,
    };
  }

  hasUser(userId: string): boolean {
    return this.members.has(userId);
  }

  isSelfId(userId?: string): boolean {
    if (!userId || userId === 'me') return true;
    const base = resolveCurrentBaseUser();
    return base.id === userId;
  }

  registerBackendFriends(
    backendFriends: Array<{
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      isOnline?: boolean;
    }>,
  ): void {
    for (const item of backendFriends) {
      if (this.members.has(item.id)) continue;
      this.runtimeExtraFriendIds.add(item.id);
      this.members.set(item.id, {
        id: item.id,
        fullName: item.fullName,
        bio: 'Thành viên tích cực trong cộng đồng kết nối Lyora.',
        location: 'Việt Nam',
        hometown: '',
        workplace: 'Thành viên cộng đồng Lyora',
        education: '',
        website: '',
        avatarUrl:
          item.avatarUrl || makeAvatarSvg(buildInitials(item.fullName), '#DBEAFE', '#1E40AF'),
        coverUrl: PROFILE_COVER_PRESETS[0].url,
        isOnline: Boolean(item.isOnline),
        createdAt: '2025-08-01T08:00:00.000Z',
        friendshipStatus: 'FRIEND',
        friendIds: ['me', 'preview-user-1', 'preview-user-2'],
      });
    }
  }

  getMyProfile(liveUser?: UserProfile | null, isPreviewFallback: boolean = true): PublicUserProfile {
    const base = liveUser ?? resolveCurrentBaseUser();
    const extras = this.readExtras();
    const myFriends = this.getMyFriendIds()
      .map((id) => this.members.get(id))
      .filter((m): m is CommunityMemberSeed => Boolean(m))
      .map((m) => this.toFriendSummary(m));

    return {
      id: base.id,
      email: base.email,
      fullName: (isPreviewFallback ? extras.fullName : undefined) ?? base.fullName,
      role: base.role,
      phoneNumber: (isPreviewFallback ? extras.phoneNumber : undefined) ?? base.phoneNumber ?? null,
      bio:
        (isPreviewFallback ? extras.bio : undefined) ??
        base.bio ??
        'Chia sẻ khoảnh khắc đời thường, kết nối bạn bè và lưu giữ những câu chuyện tích cực cùng cộng đồng Lyora.',
      location: (isPreviewFallback ? extras.location : undefined) ?? base.location ?? null,
      hometown: extras.hometown ?? 'Đà Lạt, Lâm Đồng',
      workplace: extras.workplace ?? 'Thành viên Cộng đồng Lyora',
      education: extras.education ?? '',
      website: extras.website ?? '',
      avatarUrl: extras.avatarUrl !== undefined ? extras.avatarUrl : base.avatarUrl ?? null,
      coverUrl: extras.coverUrl ?? PROFILE_COVER_PRESETS[0].url,
      isActive: base.isActive ?? true,
      isOnline: true,
      createdAt: base.createdAt ?? '2025-02-10T07:00:00.000Z',
      friendshipStatus: 'SELF',
      friendsCount: myFriends.length,
      mutualFriendsCount: 0,
      friendsPreview: myFriends,
      isPreviewFallback,
    };
  }

  saveMyExtras(
    payload: UpdateExtendedProfilePayload,
    updatedCoreUser?: UserProfile,
    isPreviewFallback: boolean = false,
  ): PublicUserProfile {
    const currentExtras = this.readExtras();
    const nextExtras: StoredProfileExtras = {
      ...currentExtras,
      ...(payload.fullName !== undefined ? { fullName: payload.fullName.trim() } : {}),
      ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber || null } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio || null } : {}),
      ...(payload.location !== undefined ? { location: payload.location || null } : {}),
      ...(payload.hometown !== undefined ? { hometown: payload.hometown || null } : {}),
      ...(payload.workplace !== undefined ? { workplace: payload.workplace || null } : {}),
      ...(payload.education !== undefined ? { education: payload.education || null } : {}),
      ...(payload.website !== undefined ? { website: payload.website || null } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      ...(payload.coverUrl !== undefined ? { coverUrl: payload.coverUrl } : {}),
    };
    this.writeExtras(nextExtras);

    const storedUser = updatedCoreUser ?? resolveCurrentBaseUser();
    const syncedUser: UserProfile = {
      ...storedUser,
      fullName: updatedCoreUser?.fullName ?? nextExtras.fullName ?? storedUser.fullName,
      phoneNumber:
        updatedCoreUser?.phoneNumber !== undefined
          ? updatedCoreUser.phoneNumber
          : nextExtras.phoneNumber ?? storedUser.phoneNumber,
      bio: updatedCoreUser?.bio !== undefined ? updatedCoreUser.bio : nextExtras.bio ?? storedUser.bio,
      location:
        updatedCoreUser?.location !== undefined
          ? updatedCoreUser.location
          : nextExtras.location ?? storedUser.location,
      avatarUrl:
        nextExtras.avatarUrl !== undefined ? nextExtras.avatarUrl : storedUser.avatarUrl,
    };

    if (TokenStorage.getUser()) {
      TokenStorage.setUser(syncedUser);
    }

    return this.getMyProfile(syncedUser, isPreviewFallback);
  }

  getProfileById(userId: string): PublicUserProfile | null {
    if (this.isSelfId(userId)) {
      return this.getMyProfile();
    }

    const member = this.members.get(userId);
    if (!member) {
      return null;
    }

    const me = this.getMyProfile();
    const friendsList: ProfileFriendSummary[] = [];

    for (const friendId of member.friendIds) {
      if (friendId === 'me') {
        if (member.friendshipStatus === 'FRIEND') {
          friendsList.push({
            id: me.id,
            fullName: me.fullName,
            avatarUrl: me.avatarUrl ?? null,
            headline: me.workplace || me.bio,
            location: me.location,
            mutualFriendsCount: member.friendIds.filter((id) => id !== 'me').length,
            friendshipStatus: 'FRIEND',
            isOnline: true,
          });
        }
        continue;
      }

      const other = this.members.get(friendId);
      if (other) {
        friendsList.push(this.toFriendSummary(other));
      }
    }

    return {
      id: member.id,
      email: null, // Bảo mật: không hiển thị email cá nhân của người dùng khác
      fullName: member.fullName,
      role: 'CLIENT',
      phoneNumber: null,
      bio: member.bio,
      location: member.location,
      hometown: member.hometown,
      workplace: member.workplace,
      education: member.education,
      website: member.website || null,
      avatarUrl: member.avatarUrl,
      coverUrl: member.coverUrl,
      isActive: true,
      isOnline: member.isOnline,
      createdAt: member.createdAt,
      friendshipStatus: member.friendshipStatus,
      friendsCount: friendsList.length,
      mutualFriendsCount: this.computeMutualCount(member),
      friendsPreview: friendsList,
      isPreviewFallback: true,
    };
  }

  getDirectory(): ProfileFriendsDirectory {
    const friends: ProfileFriendSummary[] = [];
    const incomingRequests: ProfileFriendSummary[] = [];
    const sentRequests: ProfileFriendSummary[] = [];
    const suggestions: ProfileFriendSummary[] = [];

    for (const member of this.members.values()) {
      const summary = this.toFriendSummary(member);
      if (member.friendshipStatus === 'FRIEND') {
        friends.push(summary);
      } else if (member.friendshipStatus === 'REQUEST_RECEIVED') {
        incomingRequests.push(summary);
      } else if (member.friendshipStatus === 'REQUEST_SENT') {
        sentRequests.push(summary);
      } else {
        suggestions.push(summary);
      }
    }

    return { friends, incomingRequests, sentRequests, suggestions };
  }

  private assertEditableTarget(userId: string): CommunityMemberSeed {
    if (this.isSelfId(userId)) {
      throw new Error('Không thể thực hiện thao tác kết bạn với chính tài khoản của bạn.');
    }
    const target = this.members.get(userId);
    if (!target) {
      throw new Error('Không tìm thấy hồ sơ người dùng này.');
    }
    return target;
  }

  sendFriendRequest(userId: string): PublicUserProfile {
    const target = this.assertEditableTarget(userId);
    if (target.friendshipStatus === 'NONE') {
      target.friendshipStatus = 'REQUEST_SENT';
    }
    return this.getProfileById(userId)!;
  }

  cancelFriendRequest(userId: string): PublicUserProfile {
    const target = this.assertEditableTarget(userId);
    if (target.friendshipStatus === 'REQUEST_SENT') {
      target.friendshipStatus = 'NONE';
    }
    return this.getProfileById(userId)!;
  }

  acceptFriendRequest(userId: string): PublicUserProfile {
    const target = this.assertEditableTarget(userId);
    target.friendshipStatus = 'FRIEND';
    if (!target.friendIds.includes('me')) {
      target.friendIds = ['me', ...target.friendIds];
    }
    return this.getProfileById(userId)!;
  }

  rejectFriendRequest(userId: string): PublicUserProfile {
    const target = this.assertEditableTarget(userId);
    if (target.friendshipStatus === 'REQUEST_RECEIVED') {
      target.friendshipStatus = 'NONE';
    }
    return this.getProfileById(userId)!;
  }

  unfriend(userId: string): PublicUserProfile {
    const target = this.assertEditableTarget(userId);
    target.friendshipStatus = 'NONE';
    target.friendIds = target.friendIds.filter((id) => id !== 'me');
    return this.getProfileById(userId)!;
  }

  getProfileActivity(userId?: string): ProfileActivityFeed {
    const member1 = this.members.get('preview-user-1');
    const member2 = this.members.get('preview-user-2');
    const member3 = this.members.get('preview-user-3');
    const member4 = this.members.get('preview-user-4');
    const member5 = this.members.get('preview-user-5');

    const toAuthor = (m?: CommunityMemberSeed) => ({
      id: m?.id ?? 'preview-user-1',
      fullName: m?.fullName ?? 'Nguyễn Minh Anh',
      avatarUrl: m?.avatarUrl ?? null,
    });

    if (this.isSelfId(userId)) {
      const tagged: ProfileActivityItem[] = [
        {
          id: 'prof-tag-1',
          kind: 'TAGGED',
          contextLabel: 'Đã gắn thẻ bạn trong bài viết',
          author: toAuthor(member3),
          content:
            'Cảm ơn mọi người đã tham gia buổi workshop thiết kế trải nghiệm cộng đồng chiều nay! Rất vui được trao đổi nhiều góc nhìn thực tế cùng bạn.',
          mediaPreviewUrl: makeActivitySceneSvg(
            'Workshop Cộng Đồng Lyora',
            'Tổng hợp khoảnh khắc & góc nhìn thiết kế sản phẩm',
            '#EFF6FF',
            '#DBEAFE',
            '#2563EB',
          ),
          mediaPreviewAlt: 'Ảnh workshop cộng đồng',
          visibility: 'PUBLIC',
          reactionCount: 64,
          commentCount: 12,
          shareCount: 9,
          createdAt: minutesAgo(95),
        },
        {
          id: 'prof-tag-2',
          kind: 'SHARED_TO_ME',
          contextLabel: 'Đã chia sẻ bài viết cho bạn',
          author: toAuthor(member2),
          content:
            'Tổng hợp 4 góc làm việc tối giản giúp giữ tập trung cả ngày dài. Gửi bạn tham khảo mẫu setup ánh sáng tự nhiên nè!',
          mediaPreviewUrl: null,
          mediaPreviewAlt: null,
          visibility: 'FRIENDS',
          reactionCount: 41,
          commentCount: 7,
          shareCount: 5,
          createdAt: minutesAgo(240),
        },
      ];

      const reacted: ProfileActivityItem[] = [
        {
          id: 'prof-react-1',
          kind: 'REACTED',
          contextLabel: 'Bạn đã thả Yêu thích',
          author: toAuthor(member1),
          content:
            'Buổi sáng cuối tuần ở Đà Lạt sương còn giăng nhẹ trên đồi thông. Uống một ly cà phê ấm, đọc vài trang sách và chuẩn bị tinh thần cho tuần mới thật hiệu quả!',
          mediaPreviewUrl: makeActivitySceneSvg(
            'Đà Lạt 07:15 AM',
            'Đồi thông trong sương sớm cuối tuần',
            '#E0F2FE',
            '#BAE6FD',
            '#0284C7',
          ),
          mediaPreviewAlt: 'Đồi thông Đà Lạt buổi sáng',
          visibility: 'PUBLIC',
          reactionCount: 48,
          commentCount: 8,
          shareCount: 6,
          createdAt: minutesAgo(35),
        },
        {
          id: 'prof-react-2',
          kind: 'REACTED',
          contextLabel: 'Bạn đã bày tỏ Thích',
          author: toAuthor(member5),
          content:
            'Chia sẻ nhỏ cho các bạn mới học thiết kế UI: hãy ưu tiên khoảng thở, độ tương phản chữ và phân cấp thông tin trước khi nghĩ đến hiệu ứng trang trí.',
          mediaPreviewUrl: null,
          mediaPreviewAlt: null,
          visibility: 'PUBLIC',
          reactionCount: 68,
          commentCount: 11,
          shareCount: 22,
          createdAt: minutesAgo(420),
        },
      ];

      const saved: ProfileActivityItem[] = [
        {
          id: 'prof-save-1',
          kind: 'SAVED',
          contextLabel: 'Bài viết bạn đã lưu',
          author: toAuthor(member4),
          content:
            '3 mẹo nhỏ mình rút ra sau 6 tháng tự học chạy bộ 5km mỗi sáng: ngủ đủ giấc, khởi động kỹ khớp cổ chân và giữ nhịp thở đều tuần đầu tiên.',
          mediaPreviewUrl: null,
          mediaPreviewAlt: null,
          visibility: 'PUBLIC',
          reactionCount: 34,
          commentCount: 5,
          shareCount: 8,
          createdAt: minutesAgo(180),
        },
        {
          id: 'prof-save-2',
          kind: 'SAVED',
          contextLabel: 'Bài viết bạn đã lưu',
          author: toAuthor(member1),
          content:
            'Bộ ba bức ảnh chụp film cuộn đầu tay ở Hội An: phố cổ rêu phong, giàn hoa giấy trước hiên nhà và chiếc đèn lồng buổi sớm.',
          mediaPreviewUrl: makeActivitySceneSvg(
            'Hội An · Phố cổ',
            'Tường vàng rêu phong trong nắng sớm',
            '#FEF3C7',
            '#FDE68A',
            '#D97706',
          ),
          mediaPreviewAlt: 'Phố cổ Hội An',
          visibility: 'PUBLIC',
          reactionCount: 77,
          commentCount: 9,
          shareCount: 12,
          createdAt: minutesAgo(620),
        },
      ];

      return { tagged, reacted, saved, authored: [] };
    }

    const target = this.members.get(userId!);
    if (!target) {
      return { tagged: [], reacted: [], saved: [], authored: [] };
    }

    const authored: ProfileActivityItem[] = [
      {
        id: `prof-authored-${target.id}-1`,
        kind: 'AUTHORED',
        contextLabel: 'Bài viết công khai',
        author: toAuthor(target),
        content: target.bio,
        mediaPreviewUrl: makeActivitySceneSvg(
          target.fullName,
          target.workplace || target.location,
          '#EFF6FF',
          '#DBEAFE',
          '#2563EB',
        ),
        mediaPreviewAlt: `Khoảnh khắc của ${target.fullName}`,
        visibility: 'PUBLIC',
        reactionCount: 32,
        commentCount: 6,
        shareCount: 3,
        createdAt: minutesAgo(140),
      },
    ];

    const taggedOther: ProfileActivityItem[] = [
      {
        id: `prof-tagged-${target.id}-1`,
        kind: 'TAGGED',
        contextLabel: `Được gắn thẻ cùng ${target.fullName}`,
        author: toAuthor(target.id === 'preview-user-1' ? member2 : member1),
        content: `Hẹn cuối tuần này gặp nhau trao đổi dự án cộng đồng nhé @${target.fullName}!`,
        mediaPreviewUrl: null,
        mediaPreviewAlt: null,
        visibility: 'PUBLIC',
        reactionCount: 19,
        commentCount: 4,
        shareCount: 1,
        createdAt: minutesAgo(520),
      },
    ];

    return {
      tagged: taggedOther,
      reacted: [],
      saved: [],
      authored,
    };
  }
}

export const profilePreviewStore = new ProfilePreviewStore();
