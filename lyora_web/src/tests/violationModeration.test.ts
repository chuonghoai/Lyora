import { describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '@/core';
import {
  flagPostViolationSchema,
  PostService,
  type AdminPostDetail,
  type IPostRepository,
} from '@/features/posts';
import {
  flagProfileMediaViolationSchema,
  UserService,
  type AdminUserDetail,
  type IUserRepository,
} from '@/features/user';

describe('Violation Moderation Schemas & Services', () => {
  it('validates flagPostViolationSchema and flagProfileMediaViolationSchema with Vietnamese messages', () => {
    expect(flagPostViolationSchema.safeParse({ reason: 'abc' }).success).toBe(false);
    expect(
      flagPostViolationSchema.safeParse({ reason: '  Nội dung vi phạm quy định cộng đồng  ' }),
    ).toMatchObject({
      success: true,
      data: { reason: 'Nội dung vi phạm quy định cộng đồng' },
    });

    const tooLong = 'a'.repeat(501);
    expect(flagProfileMediaViolationSchema.safeParse({ reason: tooLong }).success).toBe(false);
    expect(
      flagProfileMediaViolationSchema.safeParse({
        reason: '  Ảnh đại diện chứa nội dung phản cảm  ',
      }),
    ).toMatchObject({
      success: true,
      data: { reason: 'Ảnh đại diện chứa nội dung phản cảm' },
    });
  });

  it('UserService calls avatar & cover violation flag/clear endpoints cleanly', async () => {
    const detailFixture: AdminUserDetail = {
      id: 'user-1',
      email: 'client@lyora.vn',
      fullName: 'Minh Anh',
      role: 'CLIENT',
      phoneNumber: null,
      bio: null,
      location: null,
      hometown: null,
      workplace: null,
      education: null,
      website: null,
      avatarUrl: 'https://cdn.lyora.vn/avatar.png',
      coverUrl: 'https://cdn.lyora.vn/cover.png',
      avatarViolation: {
        reason: 'Ảnh đại diện phản cảm',
        flaggedAt: '2026-11-28T07:00:00.000Z',
        evidenceUrl: 'https://cdn.lyora.vn/avatar.png',
      },
      coverViolation: null,
      isActive: true,
      isOnline: true,
      lockReason: null,
      lockedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      friendsCount: 3,
      friendsPreview: [],
    };

    const userRepoMock = {
      flagAvatarViolation: vi.fn().mockResolvedValue({
        success: true,
        data: detailFixture,
      } satisfies ApiResponse<AdminUserDetail>),
      clearAvatarViolation: vi.fn().mockResolvedValue({
        success: true,
        data: { ...detailFixture, avatarViolation: null },
      } satisfies ApiResponse<AdminUserDetail>),
      flagCoverViolation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          ...detailFixture,
          coverViolation: {
            reason: 'Ảnh bìa chứa quảng cáo spam',
            flaggedAt: '2026-11-28T07:05:00.000Z',
            evidenceUrl: 'https://cdn.lyora.vn/cover.png',
          },
        },
      } satisfies ApiResponse<AdminUserDetail>),
      clearCoverViolation: vi.fn().mockResolvedValue({
        success: true,
        data: detailFixture,
      } satisfies ApiResponse<AdminUserDetail>),
    } as unknown as IUserRepository;

    const service = new UserService(userRepoMock);

    await expect(
      service.flagAvatarViolation('user-1', { reason: 'ngắn' }),
    ).rejects.toThrow(/tối thiểu 5 ký tự/);

    const flaggedAvatar = await service.flagAvatarViolation(' user-1 ', {
      reason: '  Ảnh đại diện phản cảm  ',
    });
    expect(userRepoMock.flagAvatarViolation).toHaveBeenCalledWith('user-1', {
      reason: 'Ảnh đại diện phản cảm',
    });
    expect(flaggedAvatar.avatarViolation?.evidenceUrl).toBe(
      'https://cdn.lyora.vn/avatar.png',
    );

    const clearedAvatar = await service.clearAvatarViolation(' user-1 ');
    expect(userRepoMock.clearAvatarViolation).toHaveBeenCalledWith('user-1');
    expect(clearedAvatar.avatarViolation).toBeNull();

    const flaggedCover = await service.flagCoverViolation(' user-1 ', {
      reason: '  Ảnh bìa chứa quảng cáo spam  ',
    });
    expect(userRepoMock.flagCoverViolation).toHaveBeenCalledWith('user-1', {
      reason: 'Ảnh bìa chứa quảng cáo spam',
    });
    expect(flaggedCover.coverViolation?.reason).toBe('Ảnh bìa chứa quảng cáo spam');

    await service.clearCoverViolation(' user-1 ');
    expect(userRepoMock.clearCoverViolation).toHaveBeenCalledWith('user-1');
  });

  it('PostService validates and dispatches flagPostViolationAsAdmin & unflagPostViolationAsAdmin', async () => {
    const detailFixture: AdminPostDetail = {
      id: 'post-99',
      author: {
        id: 'user-1',
        fullName: 'Minh Anh',
        email: 'client@lyora.vn',
        avatarUrl: null,
        avatarViolation: null,
        role: 'CLIENT',
      },
      content: 'Nội dung test kiểm duyệt',
      visibility: 'PUBLIC',
      media: [],
      taggedUserIds: [],
      moderationStatus: 'ACTIVE',
      moderationReason: null,
      moderatedAt: null,
      moderatedBy: null,
      violationFlag: {
        reason: 'Ngôn từ công kích cá nhân',
        flaggedAt: '2026-11-28T07:10:00.000Z',
      },
      reactionCount: 0,
      commentCount: 0,
      shareCount: 0,
      reactionBreakdown: {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      },
      comments: [],
      createdAt: '2026-11-28T06:00:00.000Z',
      updatedAt: '2026-11-28T07:10:00.000Z',
    };

    const postRepoMock = {
      flagAdminPostViolation: vi.fn().mockResolvedValue({
        success: true,
        data: detailFixture,
      } satisfies ApiResponse<AdminPostDetail>),
      unflagAdminPostViolation: vi.fn().mockResolvedValue({
        success: true,
        data: { ...detailFixture, violationFlag: null },
      } satisfies ApiResponse<AdminPostDetail>),
    } as unknown as IPostRepository;

    const service = new PostService(postRepoMock);

    await expect(service.flagPostViolationAsAdmin('post-99', '123')).rejects.toThrow(
      /tối thiểu 5 ký tự/,
    );

    const flagged = await service.flagPostViolationAsAdmin(
      'post-99',
      '  Ngôn từ công kích cá nhân  ',
    );
    expect(postRepoMock.flagAdminPostViolation).toHaveBeenCalledWith(
      'post-99',
      'Ngôn từ công kích cá nhân',
    );
    expect(flagged.violationFlag?.reason).toBe('Ngôn từ công kích cá nhân');

    const unflagged = await service.unflagPostViolationAsAdmin('post-99');
    expect(postRepoMock.unflagAdminPostViolation).toHaveBeenCalledWith('post-99');
    expect(unflagged.violationFlag).toBeNull();
  });
});
