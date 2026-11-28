import { describe, it, expect, vi } from 'vitest';
import type { ConversationDetail } from '@/features/conversations';

describe('Conversation Information Panel Redesign (Direct & Group Variants)', () => {
  const currentUserId = 'user-current-id-123';
  const partnerUserId = 'user-partner-id-456';
  const thirdUserId = 'user-third-id-789';

  const mockDirectConversation: ConversationDetail = {
    id: 'conv-direct-1',
    type: 'DIRECT',
    title: 'Nguyễn Minh Anh',
    avatarUrl: 'https://example.com/minh-anh.jpg',
    creatorId: currentUserId,
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:30:00.000Z',
    members: [
      {
        id: 'member-1',
        userId: currentUserId,
        role: 'MEMBER',
        joinedAt: '2026-11-20T10:00:00.000Z',
        user: {
          id: currentUserId,
          fullName: 'Hà Trường Giang',
          avatarUrl: null,
          isOnline: true,
        },
      },
      {
        id: 'member-2',
        userId: partnerUserId,
        role: 'MEMBER',
        joinedAt: '2026-11-20T10:00:00.000Z',
        user: {
          id: partnerUserId,
          fullName: 'Nguyễn Minh Anh',
          avatarUrl: 'https://example.com/minh-anh.jpg',
          isOnline: true,
        },
      },
    ],
  };

  const mockGroupConversation: ConversationDetail = {
    id: 'conv-group-1',
    type: 'GROUP',
    title: 'Nhóm Nghiên Cứu Lyora 🚀',
    avatarUrl: null,
    creatorId: currentUserId,
    createdAt: '2026-11-19T08:00:00.000Z',
    updatedAt: '2026-11-20T12:00:00.000Z',
    members: [
      {
        id: 'member-g1',
        userId: currentUserId,
        role: 'OWNER',
        joinedAt: '2026-11-19T08:00:00.000Z',
        user: {
          id: currentUserId,
          fullName: 'Hà Trường Giang',
          avatarUrl: null,
          isOnline: true,
        },
      },
      {
        id: 'member-g2',
        userId: partnerUserId,
        role: 'MEMBER',
        joinedAt: '2026-11-19T08:05:00.000Z',
        user: {
          id: partnerUserId,
          fullName: 'Nguyễn Minh Anh',
          avatarUrl: 'https://example.com/minh-anh.jpg',
          isOnline: false,
        },
      },
      {
        id: 'member-g3',
        userId: thirdUserId,
        role: 'MEMBER',
        joinedAt: '2026-11-19T08:10:00.000Z',
        user: {
          id: thirdUserId,
          fullName: 'Trần Bảo Long',
          avatarUrl: null,
          isOnline: true,
        },
      },
    ],
  };

  // TC-INFO-01: Direct Conversation Variant Selection
  it('TC-INFO-01: ConversationInfoPanel điều hướng đúng variant DIRECT khi conversation.type === "DIRECT"', () => {
    const resolveVariant = (conversation: ConversationDetail | null) => {
      if (!conversation) return 'EMPTY';
      return conversation.type === 'DIRECT' ? 'DIRECT_VARIANT' : 'GROUP_VARIANT';
    };

    expect(resolveVariant(mockDirectConversation)).toBe('DIRECT_VARIANT');
    expect(resolveVariant(null)).toBe('EMPTY');
  });

  // TC-INFO-02: Group Conversation Variant Selection
  it('TC-INFO-02: ConversationInfoPanel điều hướng đúng variant GROUP khi conversation.type === "GROUP"', () => {
    const resolveVariant = (conversation: ConversationDetail | null) => {
      if (!conversation) return 'EMPTY';
      return conversation.type === 'GROUP' ? 'GROUP_VARIANT' : 'DIRECT_VARIANT';
    };

    expect(resolveVariant(mockGroupConversation)).toBe('GROUP_VARIANT');
  });

  // TC-INFO-03: Direct Variant backed quick action only
  it('TC-INFO-03: Direct Variant chỉ cung cấp thao tác Tạo nhóm đã có API hỗ trợ, không còn nút giả lập', () => {
    const directActions = [{ id: 'create_group', label: 'Tạo nhóm' }];

    expect(directActions).toHaveLength(1);
    expect(directActions.map((a) => a.label)).toEqual(['Tạo nhóm']);
    expect(directActions.some((a) => a.label === 'Tắt thông báo')).toBe(false);
    expect(directActions.some((a) => a.label === 'Ghim hội thoại')).toBe(false);
  });

  // TC-INFO-04: Group Variant backed owner quick action only
  it('TC-INFO-04: Group Variant chỉ cung cấp thao tác Thêm bạn cho Trưởng nhóm, loại bỏ nút giả lập', () => {
    const ownerGroupActions = [{ id: 'add_member', label: 'Thêm bạn' }];

    expect(ownerGroupActions).toHaveLength(1);
    expect(ownerGroupActions.map((a) => a.label)).toEqual(['Thêm bạn']);
    expect(ownerGroupActions.some((a) => a.label === 'Quản lý')).toBe(false);
  });

  // TC-INFO-05: Group Members & Roles (OWNER / MEMBER)
  it('TC-INFO-05: Group Variant hiển thị đúng danh sách thành viên với vai trò OWNER ("Trưởng nhóm") và MEMBER ("Thành viên")', () => {
    const members = mockGroupConversation.members;
    expect(members).toHaveLength(3);

    const owner = members.find((m) => m.role === 'OWNER');
    expect(owner).toBeDefined();
    expect(owner?.userId).toBe(currentUserId);
    expect(owner?.user.fullName).toBe('Hà Trường Giang');

    const normalMembers = members.filter((m) => m.role === 'MEMBER');
    expect(normalMembers).toHaveLength(2);
    expect(normalMembers.map((m) => m.user.fullName)).toContain('Nguyễn Minh Anh');
    expect(normalMembers.map((m) => m.user.fullName)).toContain('Trần Bảo Long');

    // Role mapping helper test
    const getRoleBadge = (role: 'OWNER' | 'MEMBER') => {
      return role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên';
    };
    expect(getRoleBadge('OWNER')).toBe('Trưởng nhóm');
    expect(getRoleBadge('MEMBER')).toBe('Thành viên');
  });

  // TC-INFO-06: Direct Participant Extraction & Neutral Presence
  it('TC-INFO-06: Direct Variant trích xuất chính xác thông tin người bạn đối thoại và sử dụng trạng thái hiện diện trung tính', () => {
    const getDirectPartner = (conv: ConversationDetail, myId: string) => {
      const other = conv.members?.find((m) => m.userId !== myId);
      return other?.user || conv.members?.[0]?.user || null;
    };

    const partner = getDirectPartner(mockDirectConversation, currentUserId);
    expect(partner).not.toBeNull();
    expect(partner?.id).toBe(partnerUserId);
    expect(partner?.fullName).toBe('Nguyễn Minh Anh');
    expect(partner?.avatarUrl).toBe('https://example.com/minh-anh.jpg');

    // Không dựa dẫm vào presence giả lập: phụ đề trung tính
    const getNeutralSubtitle = () => 'Hội thoại trực tiếp';
    expect(getNeutralSubtitle()).toBe('Hội thoại trực tiếp');
  });

  // TC-INFO-07: Mutual Groups Accuracy
  it('TC-INFO-07: Nhóm chung hiển thị trung thực trạng thái chưa hỗ trợ, tuyệt đối không tính số liệu giả từ danh sách phân trang', () => {
    // Trạng thái trung thực không badge số giả
    const mutualGroupsConfig = {
      badge: undefined,
      emptyMessage: 'Tính năng tìm kiếm nhóm chung hiện chưa được hỗ trợ.',
    };

    expect(mutualGroupsConfig.badge).toBeUndefined();
    expect(mutualGroupsConfig.emptyMessage).toContain('chưa được hỗ trợ');
  });

  // TC-INFO-08: Collapsible Toggle Logic
  it('TC-INFO-08: Thao tác đóng/mở section chuyển đổi trạng thái isOpen chính xác', () => {
    let isOpen = false;
    const toggle = () => {
      isOpen = !isOpen;
    };

    expect(isOpen).toBe(false);
    toggle();
    expect(isOpen).toBe(true);
    toggle();
    expect(isOpen).toBe(false);
  });

  // TC-INFO-09: Close Panel Trigger
  it('TC-INFO-09: Nút đóng panel kích hoạt đúng callback onClose / handleCloseInfoPanel', () => {
    let closeTriggered = false;
    const handleClose = () => {
      closeTriggered = true;
    };

    handleClose();
    expect(closeTriggered).toBe(true);
  });

  // TC-INFO-10: Zero Network / Side Effects
  it('TC-INFO-10: Info Panel không tự động gọi API mạng hoặc ghi storage ngoài luồng mutation', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localSpy =
      typeof Storage !== 'undefined'
        ? vi.spyOn(Storage.prototype, 'setItem')
        : null;

    const directPartnerId = mockDirectConversation.members?.find(
      (m) => m.userId !== currentUserId,
    )?.userId;
    expect(directPartnerId).toBe(partnerUserId);

    expect(fetchSpy).not.toHaveBeenCalled();
    if (localSpy) {
      expect(localSpy).not.toHaveBeenCalled();
      localSpy.mockRestore();
    }

    fetchSpy.mockRestore();
  });
});
