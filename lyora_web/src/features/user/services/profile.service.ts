import { isApiError, type UserProfile } from '@/core';
import { updateExtendedProfileSchema } from '../models/profile.model';
import { profileRepository, type IProfileRepository } from '../repositories/profile.repository';
import type {
  ProfileActivityFeed,
  ProfileFriendsDirectory,
  PublicUserProfile,
  UpdateExtendedProfilePayload,
} from '../types/user.types';
import { profilePreviewStore } from './profilePreviewStore';

function isFallbackError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    error.statusCode === 401 ||
    error.statusCode === 403 ||
    error.statusCode === 404 ||
    error.statusCode === 503 ||
    Boolean(error.isNetworkError)
  );
}

function isHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc dữ liệu ảnh.'));
      }
    };
    reader.onerror = () => reject(new Error('Không thể tải tệp ảnh từ thiết bị.'));
    reader.readAsDataURL(file);
  });
}

function isFullPublicProfile(
  user: PublicUserProfile | UserProfile,
): user is PublicUserProfile {
  return 'friendshipStatus' in user && Array.isArray(user.friendsPreview);
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

  constructor(repository: IProfileRepository = profileRepository) {
    this.repository = repository;
  }

  private async syncLiveFriendsIfPossible(): Promise<void> {
    try {
      const response = await this.repository.getAcceptedFriends();
      if (Array.isArray(response.data) && response.data.length > 0) {
        profilePreviewStore.registerBackendFriends(response.data);
      }
    } catch (error) {
      if (!isFallbackError(error)) {
        throw error;
      }
    }
  }

  async getProfileById(userId?: string): Promise<PublicUserProfile> {
    await this.syncLiveFriendsIfPossible();

    if (profilePreviewStore.isSelfId(userId)) {
      try {
        const response = await this.repository.getMyProfile();
        if (isFullPublicProfile(response.data)) {
          return {
            ...response.data,
            isPreviewFallback: false,
          };
        }
        return profilePreviewStore.getMyProfile(response.data, false);
      } catch (error) {
        if (isFallbackError(error)) {
          return profilePreviewStore.getMyProfile(null, true);
        }
        throw error;
      }
    }

    if (this.repository.getPublicProfile) {
      try {
        const response = await this.repository.getPublicProfile(userId!);
        return {
          ...response.data,
          isPreviewFallback: false,
        };
      } catch (error) {
        if (!isFallbackError(error)) {
          throw error;
        }
      }
    }

    const target = profilePreviewStore.getProfileById(userId!);
    if (!target) {
      throw new Error('Không tìm thấy hồ sơ người dùng này.');
    }
    return target;
  }

  async getFriendsDirectory(): Promise<ProfileFriendsDirectory> {
    await this.syncLiveFriendsIfPossible();
    return profilePreviewStore.getDirectory();
  }

  async getProfileActivity(userId?: string): Promise<ProfileActivityFeed> {
    return profilePreviewStore.getProfileActivity(userId);
  }

  async uploadProfileImage(file: File): Promise<string> {
    if (this.repository.uploadProfileMedia) {
      try {
        const response = await this.repository.uploadProfileMedia(file);
        return response.data.url;
      } catch (error) {
        if (!isFallbackError(error)) {
          throw error;
        }
      }
    }
    return readFileAsDataUrl(file);
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

    const previewPayload: UpdateExtendedProfilePayload = {
      ...apiPayload,
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
      ...(payload.coverUrl !== undefined ? { coverUrl: payload.coverUrl } : {}),
    };

    try {
      const response = await this.repository.updateMyProfile(apiPayload);
      if (isFullPublicProfile(response.data)) {
        profilePreviewStore.saveMyExtras(previewPayload, response.data, false);
        return {
          ...response.data,
          coverUrl:
            response.data.coverUrl ??
            (previewPayload.coverUrl && !isHttpUrl(previewPayload.coverUrl)
              ? previewPayload.coverUrl
              : null),
          isPreviewFallback: false,
        };
      }
      return profilePreviewStore.saveMyExtras(previewPayload, response.data, false);
    } catch (error) {
      if (isFallbackError(error)) {
        return profilePreviewStore.saveMyExtras(previewPayload, undefined, true);
      }
      throw error;
    }
  }

  async sendFriendRequest(userId: string): Promise<PublicUserProfile> {
    return profilePreviewStore.sendFriendRequest(userId);
  }

  async cancelFriendRequest(userId: string): Promise<PublicUserProfile> {
    return profilePreviewStore.cancelFriendRequest(userId);
  }

  async acceptFriendRequest(userId: string): Promise<PublicUserProfile> {
    return profilePreviewStore.acceptFriendRequest(userId);
  }

  async rejectFriendRequest(userId: string): Promise<PublicUserProfile> {
    return profilePreviewStore.rejectFriendRequest(userId);
  }

  async unfriend(userId: string): Promise<PublicUserProfile> {
    return profilePreviewStore.unfriend(userId);
  }
}

export const profileService = new ProfileService();
