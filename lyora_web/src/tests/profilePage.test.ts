import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localStorageService, type ApiError } from '@/core';
import {
  profilePreviewStore,
  ProfileService,
  updateExtendedProfileSchema,
  userKeys,
  type IProfileRepository,
} from '@/features/user';
import { PostService, type IPostRepository } from '@/features/posts';
import {
  getClientProfilePath,
  isClientProfilePathname,
  ROUTES,
} from '@/routes/paths';

describe('Profile Page Feature (Own Profile Composer & Posts, /{userId} URL & Click-to-Profile)', () => {
  beforeEach(() => {
    profilePreviewStore.reset();
    localStorageService.removeItem('lyora:profile-preview-extras');
  });

  it('defines centralized /{userId} profile routes and path helper', () => {
    expect(ROUTES.CLIENT.PROFILE).toBe('/me');
    expect(ROUTES.CLIENT.PROFILE_DETAIL).toBe('/:userId');
    expect(getClientProfilePath()).toBe('/me');
    expect(getClientProfilePath(undefined, 'user-real-1')).toBe('/user-real-1');
    expect(getClientProfilePath('me', 'user-real-1')).toBe('/user-real-1');
    expect(getClientProfilePath('preview-user-1')).toBe('/preview-user-1');

    expect(isClientProfilePathname('/preview-user-1')).toBe(true);
    expect(isClientProfilePathname('/11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isClientProfilePathname('/profile/preview-user-1')).toBe(true);
    expect(isClientProfilePathname('/')).toBe(false);
    expect(isClientProfilePathname('/messages')).toBe(false);
    expect(isClientProfilePathname('/admin')).toBe(false);
    expect(isClientProfilePathname('/login')).toBe(false);
  });

  it('produces deterministic hierarchical query keys for profile page & directory', () => {
    expect(userKeys.profilePage()).toEqual(['users', 'profile-page', 'me']);
    expect(userKeys.profilePage('preview-user-1')).toEqual([
      'users',
      'profile-page',
      'preview-user-1',
    ]);
    expect(userKeys.profileActivity()).toEqual(['users', 'profile-activity', 'me']);
    expect(userKeys.friendsDirectory()).toEqual(['users', 'friends-directory']);
  });

  it('validates extended profile edit schema with Vietnamese messages', () => {
    const invalidName = updateExtendedProfileSchema.safeParse({
      fullName: 'A',
      phoneNumber: '0908123456',
    });
    expect(invalidName.success).toBe(false);
    if (!invalidName.success) {
      expect(invalidName.error.issues[0]?.message).toContain('ít nhất 2 ký tự');
    }

    const invalidPhone = updateExtendedProfileSchema.safeParse({
      fullName: 'Nguyễn Minh Anh',
      phoneNumber: '123',
    });
    expect(invalidPhone.success).toBe(false);
    if (!invalidPhone.success) {
      expect(invalidPhone.error.issues[0]?.message).toContain('Số điện thoại');
    }

    const invalidWebsite = updateExtendedProfileSchema.safeParse({
      fullName: 'Nguyễn Minh Anh',
      website: 'khong-hop-le',
    });
    expect(invalidWebsite.success).toBe(false);

    const validPayload = updateExtendedProfileSchema.safeParse({
      fullName: 'Trịnh Đại Nghĩa',
      phoneNumber: '0908123456',
      bio: 'Yêu thích xây dựng sản phẩm cộng đồng gọn gàng.',
      location: 'TP. Hồ Chí Minh',
      hometown: 'Đà Lạt',
      workplace: 'Lyora Studio',
      education: 'Đại học Sư phạm Kỹ thuật',
      website: 'https://lyora.vn',
    });
    expect(validPayload.success).toBe(true);
  });

  it('fetches and updates own profile via live repository and omits non-http data URIs', async () => {
    const mockRepo: IProfileRepository = {
      getMyProfile: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-real-1',
          email: 'nghia@lyora.vn',
          fullName: 'Trịnh Đại Nghĩa',
          role: 'CLIENT',
          phoneNumber: '0909111222',
          bio: 'Hồ sơ thật từ Backend',
          location: 'TP.HCM',
          hometown: null,
          workplace: null,
          education: null,
          website: null,
          avatarUrl: null,
          coverUrl: null,
          isActive: true,
          isOnline: true,
          createdAt: '2025-01-15T00:00:00.000Z',
          friendshipStatus: 'SELF',
          friendsCount: 0,
          mutualFriendsCount: 0,
          friendsPreview: [],
        },
      }),
      getPublicProfile: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-other-1',
          email: null,
          fullName: 'Nguyễn Minh Anh',
          role: 'CLIENT',
          phoneNumber: null,
          bio: 'Hồ sơ người khác',
          location: 'TP.HCM',
          hometown: 'Đà Lạt',
          workplace: 'Lyora',
          education: null,
          website: 'https://lyora.vn',
          avatarUrl: null,
          coverUrl: null,
          isActive: true,
          isOnline: false,
          createdAt: '2025-02-01T00:00:00.000Z',
          friendshipStatus: 'FRIEND',
          friendsCount: 2,
          mutualFriendsCount: 1,
          friendsPreview: [],
        },
      }),
      updateMyProfile: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-real-1',
          email: 'nghia@lyora.vn',
          fullName: 'Trịnh Đại Nghĩa (Đã sửa)',
          role: 'CLIENT',
          phoneNumber: '0909111333',
          bio: 'Cập nhật tiểu sử mới',
          location: 'Hà Nội',
          hometown: null,
          workplace: 'Lyora Team',
          education: null,
          website: null,
          avatarUrl: null,
          coverUrl: 'data:image/svg+xml;utf8,local-preset',
          isActive: true,
          isOnline: true,
          createdAt: '2025-01-15T00:00:00.000Z',
          friendshipStatus: 'SELF',
          friendsCount: 0,
          mutualFriendsCount: 0,
          friendsPreview: [],
        },
      }),
      getAcceptedFriends: vi.fn().mockResolvedValue({
        success: true,
        data: [],
      }),
    };

    const service = new ProfileService(mockRepo);
    const profile = await service.getProfileById('me');
    expect(profile.isPreviewFallback).toBe(false);
    expect(profile.friendshipStatus).toBe('SELF');
    expect(profile.fullName).toBe('Trịnh Đại Nghĩa');

    const otherProfile = await service.getProfileById('user-other-1');
    expect(mockRepo.getPublicProfile).toHaveBeenCalledWith('user-other-1');
    expect(otherProfile.email).toBeNull();
    expect(otherProfile.friendshipStatus).toBe('FRIEND');

    const updated = await service.updateMyProfile({
      fullName: 'Trịnh Đại Nghĩa (Đã sửa)',
      phoneNumber: '0909111333',
      bio: 'Cập nhật tiểu sử mới',
      location: 'Hà Nội',
      workplace: 'Lyora Team',
      coverUrl: 'data:image/svg+xml;utf8,local-preset',
    });
    expect(mockRepo.updateMyProfile).toHaveBeenCalledWith({
      fullName: 'Trịnh Đại Nghĩa (Đã sửa)',
      phoneNumber: '0909111333',
      bio: 'Cập nhật tiểu sử mới',
      location: 'Hà Nội',
      hometown: null,
      workplace: 'Lyora Team',
      education: null,
      website: null,
    });
    expect(updated.fullName).toBe('Trịnh Đại Nghĩa (Đã sửa)');
    expect(updated.workplace).toBe('Lyora Team');
  });

  it('falls back to preview store on 404/network error and handles other profiles & friendship transitions', async () => {
    const notFound: ApiError = {
      statusCode: 404,
      message: 'Not Found',
      error: 'NotFound',
    };
    const mockRepo: IProfileRepository = {
      getMyProfile: vi.fn().mockRejectedValue(notFound),
      getPublicProfile: vi.fn().mockRejectedValue(notFound),
      updateMyProfile: vi.fn().mockRejectedValue(notFound),
      getAcceptedFriends: vi.fn().mockRejectedValue(notFound),
    };

    const service = new ProfileService(mockRepo);
    const ownProfile = await service.getProfileById('me');
    expect(ownProfile.isPreviewFallback).toBe(true);
    expect(ownProfile.friendsCount).toBe(ownProfile.friendsPreview.length);

    // Xem hồ sơ người dùng chưa kết bạn (preview-user-8 -> NONE)
    const strangerProfile = await service.getProfileById('preview-user-8');
    expect(strangerProfile.friendshipStatus).toBe('NONE');
    expect(strangerProfile.email).toBeNull();
    expect(strangerProfile.mutualFriendsCount).toBeGreaterThan(0);

    // Gửi lời mời -> Hủy lời mời
    const afterSend = await service.sendFriendRequest('preview-user-8');
    expect(afterSend.friendshipStatus).toBe('REQUEST_SENT');

    const afterCancel = await service.cancelFriendRequest('preview-user-8');
    expect(afterCancel.friendshipStatus).toBe('NONE');

    // Chấp nhận lời mời từ preview-user-6 (REQUEST_RECEIVED -> FRIEND)
    const initialDir = await service.getFriendsDirectory();
    const initialFriendsCount = initialDir.friends.length;

    const afterAccept = await service.acceptFriendRequest('preview-user-6');
    expect(afterAccept.friendshipStatus).toBe('FRIEND');

    const updatedDir = await service.getFriendsDirectory();
    expect(updatedDir.friends.length).toBe(initialFriendsCount + 1);

    // Hủy kết bạn -> quay về NONE và giảm số bạn bè
    const afterUnfriend = await service.unfriend('preview-user-6');
    expect(afterUnfriend.friendshipStatus).toBe('NONE');

    const finalDir = await service.getFriendsDirectory();
    expect(finalDir.friends.length).toBe(initialFriendsCount);
  });

  it('prevents self-targeted friend actions and throws when userId does not exist', async () => {
    const notFound: ApiError = {
      statusCode: 404,
      message: 'Not Found',
      error: 'NotFound',
    };
    const mockRepo: IProfileRepository = {
      getMyProfile: vi.fn(),
      getPublicProfile: vi.fn().mockRejectedValue(notFound),
      updateMyProfile: vi.fn(),
      getAcceptedFriends: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    const service = new ProfileService(mockRepo);
    await expect(service.sendFriendRequest('me')).rejects.toThrow(
      'Không thể thực hiện thao tác kết bạn với chính tài khoản của bạn.',
    );
    await expect(service.getProfileById('non-existent-id')).rejects.toThrow(
      'Không tìm thấy hồ sơ người dùng này.',
    );
  });

  it('returns own tagged/reacted/saved activity and filters profile authored posts by authorId', async () => {
    const mockRepo: IProfileRepository = {
      getMyProfile: vi.fn(),
      updateMyProfile: vi.fn(),
      getAcceptedFriends: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    const service = new ProfileService(mockRepo);
    const ownActivity = await service.getProfileActivity('me');
    expect(ownActivity.tagged.length).toBeGreaterThan(0);
    expect(ownActivity.reacted.length).toBeGreaterThan(0);
    expect(ownActivity.saved.length).toBeGreaterThan(0);

    const otherActivity = await service.getProfileActivity('preview-user-1');
    expect(otherActivity.tagged.length).toBeGreaterThan(0);
    expect(otherActivity.reacted).toEqual([]);
    expect(otherActivity.saved).toEqual([]);

    const notFound: ApiError = {
      statusCode: 404,
      message: 'Not Found',
      error: 'NotFound',
    };
    const failingPostRepo = {
      getPosts: vi.fn().mockRejectedValue(notFound),
    } as unknown as IPostRepository;
    const postService = new PostService(failingPostRepo);
    const authoredByUser1 = await postService.getPosts({
      page: 1,
      limit: 10,
      authorId: 'preview-user-1',
    });
    expect(authoredByUser1.items.length).toBeGreaterThan(0);
    expect(
      authoredByUser1.items.every((post) => post.author.id === 'preview-user-1'),
    ).toBe(true);
  });
});
