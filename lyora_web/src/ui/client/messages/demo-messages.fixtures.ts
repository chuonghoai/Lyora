import type { ConversationDetail } from '@/features/conversations';

export interface DemoChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  isOutgoing: boolean;
}

/**
 * Sinh danh sách tin nhắn demo ban đầu dựa theo thành viên thực tế của hội thoại
 */
export function getInitialDemoMessages(
  conversation: ConversationDetail | null,
  currentUserId?: string,
): DemoChatMessage[] {
  if (!conversation) {
    return [];
  }

  const now = Date.now();
  const convId = conversation.id;

  if (conversation.type === 'DIRECT') {
    // Tìm đối tác trong hội thoại trực tiếp
    const partnerMember = conversation.members?.find(
      (m) => m.userId !== currentUserId,
    );
    if (!partnerMember) {
      return [];
    }

    const partnerName = partnerMember.user?.fullName || 'Người bạn';
    const partnerAvatar = partnerMember.user?.avatarUrl ?? null;
    const partnerId = partnerMember.userId;

    return [
      {
        id: `mock-init-${convId}-1`,
        conversationId: convId,
        senderId: partnerId,
        senderName: partnerName,
        senderAvatarUrl: partnerAvatar,
        content: `Xin chào! Rất vui được kết nối với bạn trên Lyora. 👋`,
        createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
      {
        id: `mock-init-${convId}-2`,
        conversationId: convId,
        senderId: partnerId,
        senderName: partnerName,
        senderAvatarUrl: partnerAvatar,
        content: `Đây là giao diện xem trước khung trò chuyện (Chat UI Demo). Bạn có thể thử nhập và gửi tin nhắn bên dưới! ✨`,
        createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
    ];
  }

  if (conversation.type === 'GROUP') {
    // Lấy các thành viên trong nhóm (trừ người dùng hiện tại)
    const otherMembers =
      conversation.members?.filter((m) => m.userId !== currentUserId) ?? [];

    if (otherMembers.length === 0) {
      return [];
    }

    const member1 = otherMembers[0];
    const member2 = otherMembers[1] || otherMembers[0];

    const messages: DemoChatMessage[] = [
      {
        id: `mock-init-${convId}-1`,
        conversationId: convId,
        senderId: member1.userId,
        senderName: member1.user?.fullName || 'Thành viên nhóm',
        senderAvatarUrl: member1.user?.avatarUrl ?? null,
        content: `Chào mừng mọi người đã tham gia nhóm "${conversation.title}"! 🎉`,
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
    ];

    if (otherMembers.length > 1) {
      messages.push({
        id: `mock-init-${convId}-2`,
        conversationId: convId,
        senderId: member2.userId,
        senderName: member2.user?.fullName || 'Thành viên nhóm',
        senderAvatarUrl: member2.user?.avatarUrl ?? null,
        content: `Chào cả nhóm nhé! Giao diện Lyora nhìn rất trực quan và gọn gàng.`,
        createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
        isOutgoing: false,
      });
    }

    return messages;
  }

  return [];
}
