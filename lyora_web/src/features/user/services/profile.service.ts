import { useAuthStore, type UserProfile } from '@/core';
import {
  friendsRepository,
  type IFriendsRepository,
} from '@/features/friends/repositories/friends.repository';
import { updateExtendedProfileSchema } from '../models/profile.model';
import { profileRepository, type IProfileRepository } from '../repositories/profile.repository';
import type {
  ProfileActivityFeed,
  ProfileFriendsDirectory,
  ProfileFriendSummary,
  PublicUserProfile,
  UpdateExtendedProfilePayload,
} from '../types/user.types';

function isHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

function isFullPublicProfile(
  user: PublicUserProfile | UserProfile,
): user is PublicUserProfile {
  return 'friendshipStatus' in user && Array.isArray(user.friendsPreview);
}

function normalizeUserToPublicProfile(user: UserProfile): PublicUserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phoneNumber: user.phoneNumber ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    hometown: user.hometown ?? null,
    workplace: user.workplace ?? null,
    education: user.education ?? null,
    website: user.website ?? null,
    avatarUrl: user.avatarUrl ?? null,
    coverUrl: user.coverUrl ?? null,
    isActive: user.isActive ?? true,
    isOnline:
      'isOnline' in user && typeof (user as { isOnline?: unknown }).isOnline === 'boolean'
        ? (user as { isOnline: boolean }).isOnline
        : false,
    createdAt: user.createdAt ?? '',
    friendshipStatus: 'SELF',
    friendsCount: 0,
    mutualFriendsCount: 0,
    friendsPreview: [],
  };
}

function isSelfIdentifier(userId?: string): boolean {
  const normalized = userId?.trim();
  if (!normalized || normalized === 'me') return true;
  const currentUserId = useAuthStore.getState().user?.id;
  return Boolean(currentUserId && normalized === currentUserId);
}

export interface IProfileService {
  getProfileById(userId?: string): Promise<PublicUserProfile>;
  getFriendsDirectory(): Promise<ProfileFriendsDirectory>;
  getProfileActivity(userId?: string): Promise<ProfileActivityFeed>;
  updateMyProfile(payload: UpdateExtendedProfilePayload): Promise<PublicUserProfile>;
  uploadProfileImage(file: File): Promise<string>;
  sendFriendRequest(userId: string): Promise<PublicUserProfile>;
  cancelFriendRequest(userId: string): Promise<PublicUserProfile>;
  acceptFriendRequest(userId: string): Promise<PublicUserProfile>;
  rejectFriendRequest(userId: string): Promise<PublicUserProfile>;
  unfriend(userId: string): Promise<PublicUserProfile>;
}

export class ProfileService implements IProfileService {
  private readonly repository: IProfileRepository;
  private readonly friendsRepo: IFriendsRepository;

  constructor(
    repository: IProfileRepository = profileRepository,
    friendsRepo: IFriendsRepository = friendsRepository,
  ) {
    this.repository = repository;
    this.friendsRepo = friendsRepo;
  }

  async getProfileById(userId?: string): Promise<PublicUserProfile> {
    if (isSelfIdentifier(userId)) {
      const response = await this.repository.getMyProfile();
      return isFullPublicProfile(response.data)
        ? response.data
        : normalizeUserToPublicProfile(response.data);
    }

    if (!this.repository.getPublicProfile) {
      throw new Error('Không thể tải hồ sơ người dùng này.');
    }

    const response = await this.repository.getPublicProfile(userId!.trim());
    return response.data;
  }

  async getFriendsDirectory(): Promise<ProfileFriendsDirectory> {
    const [friendsRes, receivedRes] = await Promise.all([
      this.friendsRepo.getAcceptedFriends(),
      this.friendsRepo.getReceivedRequests(),
    ]);

    const friends: ProfileFriendSummary[] = (friendsRes.data ?? []).map((item) => ({
      id: item.id,
      fullName: item.fullName,
      avatarUrl: item.avatarUrl ?? null,
      headline: item.workplace ?? null,
      location: item.location ?? null,
      mutualFriendsCount: 0,
      friendshipStatus: 'FRIEND',
      isOnline: item.isOnline ?? false,
    }));

    const incomingRequests: ProfileFriendSummary[] = (receivedRes.data ?? []).map((item) => ({
      id: item.id,
      fullName: item.fullName,
      avatarUrl: item.avatarUrl ?? null,
      headline: item.workplace ?? null,
      location: item.location ?? null,
      mutualFriendsCount: 0,
      friendshipStatus: 'REQUEST_RECEIVED',
      isOnline: item.isOnline ?? false,
    }));

    return {
      friends,
      incomingRequests,
      sentRequests: [],
    };
  }

  async getProfileActivity(_userId?: string): Promise<ProfileActivityFeed> {
    void _userId;
    // Backend hiện chưa cung cấp API cho danh sách bài gắn thẻ / đã bày tỏ cảm xúc / đã lưu.
    return {
      tagged: [],
      reacted: [],
      saved: [],
      authored: [],
    };
  }

  async uploadProfileImage(file: File): Promise<string> {
    if (!this.repository.uploadProfileMedia) {
      throw new Error('Chức năng tải ảnh hồ sơ hiện chưa khả dụng.');
    }
    const response = await this.repository.uploadProfileMedia(file);
    return response.data.url;
  }

  async updateMyProfile(payload: UpdateExtendedProfilePayload): Promise<PublicUserProfile> {
    const parsed = updateExtendedProfileSchema.safeParse({
      fullName: payload.fullName ?? '',
      phoneNumber: payload.phoneNumber ?? '',
      bio: payload.bio ?? '',
      location: payload.location ?? '',
      hometown: payload.hometown ?? '',
      workplace: payload.workplace ?? '',
      education: payload.education ?? '',
      website: payload.website ?? '',
    });

    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Thông tin hồ sơ chưa hợp lệ, vui lòng kiểm tra lại.',
      );
    }

    const apiPayload: UpdateExtendedProfilePayload = {
      fullName: parsed.data.fullName,
      phoneNumber: parsed.data.phoneNumber ? parsed.data.phoneNumber : null,
      bio: parsed.data.bio ? parsed.data.bio : null,
      location: parsed.data.location ? parsed.data.location : null,
      hometown: parsed.data.hometown ? parsed.data.hometown : null,
      workplace: parsed.data.workplace ? parsed.data.workplace : null,
      education: parsed.data.education ? parsed.data.education : null,
      website: parsed.data.website ? parsed.data.website : null,
      ...(payload.avatarUrl === null || isHttpUrl(payload.avatarUrl)
        ? { avatarUrl: payload.avatarUrl }
        : {}),
      ...(payload.coverUrl === null || isHttpUrl(payload.coverUrl)
        ? { coverUrl: payload.coverUrl }
        : {}),
    };

    const response = await this.repository.updateMyProfile(apiPayload);
    return isFullPublicProfile(response.data)
      ? response.data
      : normalizeUserToPublicProfile(response.data);
  }

  private assertNotSelfTarget(userId: string): string {
    const trimmed = userId.trim();
    if (!trimmed || isSelfIdentifier(trimmed)) {
      throw new Error('Không thể thực hiện thao tác kết bạn với chính tài khoản của bạn.');
    }
    return trimmed;
  }

  async sendFriendRequest(userId: string): Promise<PublicUserProfile> {
    const targetId = this.assertNotSelfTarget(userId);
    await this.friendsRepo.sendRequest(targetId);
    return this.getProfileById(targetId);
  }

  async cancelFriendRequest(userId: string): Promise<PublicUserProfile> {
    const targetId = this.assertNotSelfTarget(userId);
    await this.friendsRepo.removeRequest(targetId);
    return this.getProfileById(targetId);
  }

  async acceptFriendRequest(userId: string): Promise<PublicUserProfile> {
    const targetId = this.assertNotSelfTarget(userId);
    await this.friendsRepo.acceptRequest(targetId);
    return this.getProfileById(targetId);
  }

  async rejectFriendRequest(userId: string): Promise<PublicUserProfile> {
    const targetId = this.assertNotSelfTarget(userId);
    await this.friendsRepo.removeRequest(targetId);
    return this.getProfileById(targetId);
  }

  async unfriend(userId: string): Promise<PublicUserProfile> {
    const targetId = this.assertNotSelfTarget(userId);
    await this.friendsRepo.unfriend(targetId);
    return this.getProfileById(targetId);
  }
}

export const profileService = new ProfileService();
