import { describe, expect, it, vi } from 'vitest';
import type { ApiError, ApiResponse, PaginationMeta } from '@/core';
import {
  buildFinalLockReason,
  createAdminUserFormSchema,
  lockUserFormSchema,
  UserService,
  type AdminUserDetail,
  type AdminUsersSummaryCounts,
  type AdminUserSummaryItem,
  type IUserRepository,
} from '@/features/user';
import { extractLockedAccountNotice } from '@/ui/auth/login/login.controller';

describe('Admin Users Management - Model, Lock Notice & UserService', () => {
  it('validates lockUserFormSchema requiring detail only when OTHER is selected', () => {
    const validPresetEmptyDetail = lockUserFormSchema.safeParse({
      reasonKey: 'HARASSMENT',
      detail: '',
    });
    expect(validPresetEmptyDetail.success).toBe(true);

    const invalidOtherShort = lockUserFormSchema.safeParse({
      reasonKey: 'OTHER',
      detail: 'Quá ngắn',
    });
    expect(invalidOtherShort.success).toBe(false);

    const validOther = lockUserFormSchema.safeParse({
      reasonKey: 'OTHER',
      detail: 'Vi phạm nghiêm trọng quy định an toàn tài khoản của hệ thống.',
    });
    expect(validOther.success).toBe(true);
  });

  it('builds final lock reason using preset label directly or keeping OTHER detail', () => {
    const presetReason = buildFinalLockReason('SPAM_OR_SCAM', '');
    expect(presetReason).toBe('Phát tán spam, lừa đảo hoặc nội dung giả mạo');

    const otherReason = buildFinalLockReason(
      'OTHER',
      '  Mạo danh quản trị viên hỗ trợ kỹ thuật  ',
    );
    expect(otherReason).toBe('Mạo danh quản trị viên hỗ trợ kỹ thuật');
  });

  it('extractLockedAccountNotice extracts reason only for ACCOUNT_LOCKED ApiError', () => {
    const genericError: ApiError = {
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác',
    };
    expect(extractLockedAccountNotice(genericError)).toBeNull();
    expect(extractLockedAccountNotice(new Error('Network error'))).toBeNull();

    const lockedError: ApiError = {
      statusCode: 403,
      message: 'Tài khoản của bạn đã bị khóa.',
      code: 'ACCOUNT_LOCKED',
      details: {
        lockReason: 'Phát tán spam lặp lại nhiều lần',
        lockedAt: '2026-11-28T08:00:00.000Z',
      },
    };
    expect(extractLockedAccountNotice(lockedError)).toEqual({
      lockReason: 'Phát tán spam lặp lại nhiều lần',
      lockedAt: '2026-11-28T08:00:00.000Z',
    });
  });

  it('UserService delegates getAdminUsers, getAdminUserDetail, lockUser, unlockUser cleanly', async () => {
    const mockMeta: PaginationMeta = {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
    const mockSummary: AdminUsersSummaryCounts = {
      all: 10,
      client: 8,
      admin: 2,
      active: 9,
      locked: 1,
      online: 3,
    };
    const mockUserItem: AdminUserSummaryItem = {
      id: 'user-1',
      email: 'member@lyora.vn',
      fullName: 'Nguyễn Minh Anh',
      role: 'CLIENT',
      isActive: true,
      isOnline: true,
      lockReason: null,
      lockedAt: null,
      avatarUrl: null,
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    const mockDetail: AdminUserDetail = {
      ...mockUserItem,
      avatarUrl: null,
      lockReason: null,
      lockedAt: null,
      phoneNumber: '0909123456',
      bio: 'Thành viên Lyora',
      location: 'TP.HCM',
      hometown: null,
      workplace: null,
      education: null,
      website: null,
      coverUrl: null,
      friendsCount: 2,
      friendsPreview: [],
    };

    const repoMock: IUserRepository = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      getStatistics: vi.fn(),
      getAdminUsers: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [mockUserItem], summary: mockSummary },
        meta: mockMeta,
      } satisfies ApiResponse<{ items: AdminUserSummaryItem[]; summary: AdminUsersSummaryCounts }>),
      getUsersOnlineStatus: vi.fn().mockResolvedValue({
        success: true,
        data: {
          statuses: { 'user-1': true },
          onlineCount: 4,
          checkedAt: '2026-11-28T10:00:00.000Z',
        },
      }),
      getAdminUserDetail: vi.fn().mockResolvedValue({
        success: true,
        data: mockDetail,
      } satisfies ApiResponse<AdminUserDetail>),
      createUser: vi.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockUserItem,
          id: 'user-created',
          email: 'created@lyora.vn',
          fullName: 'Quản Trị Mới',
          role: 'ADMIN',
        },
      } satisfies ApiResponse<AdminUserSummaryItem>),
      lockUser: vi.fn().mockResolvedValue({
        success: true,
        data: { ...mockUserItem, isActive: false, isOnline: false, lockReason: 'Vi phạm quy định' },
      } satisfies ApiResponse<AdminUserSummaryItem>),
      unlockUser: vi.fn().mockResolvedValue({
        success: true,
        data: { ...mockUserItem, isActive: true, lockReason: null },
      } satisfies ApiResponse<AdminUserSummaryItem>),
    };

    const service = new UserService(repoMock);

    const listResult = await service.getAdminUsers({ page: 1, limit: 10, role: 'CLIENT' });
    expect(listResult.items).toHaveLength(1);
    expect(listResult.summary.online).toBe(3);
    expect(listResult.meta.totalItems).toBe(1);

    const detailResult = await service.getAdminUserDetail('  user-1  ');
    expect(repoMock.getAdminUserDetail).toHaveBeenCalledWith('user-1');
    expect(detailResult.email).toBe('member@lyora.vn');

    const locked = await service.lockUser('  user-1 ', { reason: '  Vi phạm quy định  ' });
    expect(repoMock.lockUser).toHaveBeenCalledWith('user-1', { reason: 'Vi phạm quy định' });
    expect(locked.isActive).toBe(false);

    const unlocked = await service.unlockUser(' user-1 ');
    expect(repoMock.unlockUser).toHaveBeenCalledWith('user-1');
    expect(unlocked.isActive).toBe(true);

    const onlineResult = await service.getUsersOnlineStatus([' ', 'user-1', 'user-1']);
    expect(repoMock.getUsersOnlineStatus).toHaveBeenCalledWith(['user-1']);
    expect(onlineResult.statuses['user-1']).toBe(true);
    expect(onlineResult.onlineCount).toBe(4);

    const emptyOnlineResult = await service.getUsersOnlineStatus([]);
    expect(emptyOnlineResult.statuses).toEqual({});
    expect(repoMock.getUsersOnlineStatus).toHaveBeenCalledTimes(1);

    const createdUser = await service.createUser({
      fullName: '  Quản Trị Mới  ',
      email: '  Created@Lyora.VN  ',
      password: 'Password123',
      role: 'ADMIN',
    });
    expect(repoMock.createUser).toHaveBeenCalledWith({
      fullName: 'Quản Trị Mới',
      email: 'created@lyora.vn',
      password: 'Password123',
      role: 'ADMIN',
    });
    expect(createdUser.role).toBe('ADMIN');
  });

  it('validates createAdminUserFormSchema for fullName, email, password, confirmPassword and role', () => {
    expect(
      createAdminUserFormSchema.safeParse({
        fullName: '   ',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
        role: 'CLIENT',
      }).success,
    ).toBe(false);

    expect(
      createAdminUserFormSchema.safeParse({
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@lyora.vn',
        password: 'password123',
        confirmPassword: 'differentPassword',
        role: 'ADMIN',
      }).success,
    ).toBe(false);

    expect(
      createAdminUserFormSchema.safeParse({
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@lyora.vn',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'ADMIN',
      }).success,
    ).toBe(true);
  });
});
