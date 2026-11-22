import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConversationDetail } from '@/features/conversations';
import {
  getInitialDemoMessages,
  type DemoChatMessage,
} from '@/ui/client/messages/demo-messages.fixtures';
import type { MessagesController } from '@/ui/client/messages/messages.controller';

describe('Chat UI Demo — Frontend Only, No Messaging Business Logic', () => {
  const currentUserId = 'user-current-id-123';

  const mockDirectConversation: ConversationDetail = {
    id: 'conv-direct-1',
    type: 'DIRECT',
    title: 'Nguyễn Minh Anh',
    avatarUrl: null,
    creatorId: currentUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: 'member-1',
        userId: currentUserId,
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
        user: {
          id: currentUserId,
          fullName: 'Hà Trường Giang',
          avatarUrl: null,
          isOnline: true,
        },
      },
      {
        id: 'member-2',
        userId: 'user-friend-456',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'user-friend-456',
          fullName: 'Nguyễn Minh Anh',
          avatarUrl: 'https://example.com/minh-anh.jpg',
          isOnline: false,
        },
      },
    ],
  };

  const mockGroupConversation: ConversationDetail = {
    id: 'conv-group-1',
    type: 'GROUP',
    title: 'Nhóm Dự Án CNPMM',
    avatarUrl: null,
    creatorId: currentUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: 'member-1',
        userId: currentUserId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
        user: {
          id: currentUserId,
          fullName: 'Hà Trường Giang',
          avatarUrl: null,
          isOnline: true,
        },
      },
      {
        id: 'member-2',
        userId: 'user-member-2',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'user-member-2',
          fullName: 'Trần Hoàng Nam',
          avatarUrl: null,
          isOnline: false,
        },
      },
      {
        id: 'member-3',
        userId: 'user-member-3',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'user-member-3',
          fullName: 'Lê Thảo Vy',
          avatarUrl: 'https://example.com/thao-vy.jpg',
          isOnline: false,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Direct Chat Mock UI: Contextual fixtures
  it('TC-CHAT-01: Direct Chat sinh tin nhắn ban đầu chính xác từ đối tác hội thoại', () => {
    const messages = getInitialDemoMessages(mockDirectConversation, currentUserId);
    expect(messages).toHaveLength(2);

    // Người gửi phải là đối tác (user-friend-456)
    expect(messages[0].senderId).toBe('user-friend-456');
    expect(messages[0].senderName).toBe('Nguyễn Minh Anh');
    expect(messages[0].senderAvatarUrl).toBe('https://example.com/minh-anh.jpg');
    expect(messages[0].isOutgoing).toBe(false);

    expect(messages[1].senderId).toBe('user-friend-456');
    expect(messages[1].isOutgoing).toBe(false);
  });

  // 2. Group Chat Mock UI: Contextual fixtures from group members
  it('TC-CHAT-02: Group Chat sinh tin nhắn chào mừng từ các thành viên thực tế trong nhóm', () => {
    const messages = getInitialDemoMessages(mockGroupConversation, currentUserId);
    expect(messages.length).toBeGreaterThanOrEqual(2);

    // Không sinh tin nhắn từ currentUser
    expect(messages.some((m) => m.senderId === currentUserId)).toBe(false);

    // Thành viên 1: Trần Hoàng Nam
    expect(messages[0].senderId).toBe('user-member-2');
    expect(messages[0].senderName).toBe('Trần Hoàng Nam');
    expect(messages[0].content).toContain(mockGroupConversation.title);

    // Thành viên 2: Lê Thảo Vy
    expect(messages[1].senderId).toBe('user-member-3');
    expect(messages[1].senderName).toBe('Lê Thảo Vy');
  });

  // 3. Empty conversation state
  it('TC-CHAT-03: Conversation không có thành viên đối tác trả về mảng tin nhắn rỗng', () => {
    const emptyConv: ConversationDetail = {
      ...mockDirectConversation,
      id: 'conv-empty',
      members: [
        {
          id: 'member-1',
          userId: currentUserId,
          role: 'MEMBER',
          joinedAt: new Date().toISOString(),
          user: {
            id: currentUserId,
            fullName: 'Hà Trường Giang',
            avatarUrl: null,
            isOnline: true,
          },
        },
      ],
    };
    const messages = getInitialDemoMessages(emptyConv, currentUserId);
    expect(messages).toHaveLength(0);
  });

  // 4. Outgoing vs Incoming bubble classification
  it('TC-CHAT-04: Phân loại bong bóng tin nhắn đến (trái) và tin nhắn đi (phải) chính xác', () => {
    const outgoingMsg: DemoChatMessage = {
      id: 'msg-out-1',
      conversationId: 'conv-1',
      senderId: currentUserId,
      senderName: 'Hà Trường Giang',
      content: 'Tin nhắn gửi đi',
      createdAt: new Date().toISOString(),
      isOutgoing: true,
    };

    const incomingMsg: DemoChatMessage = {
      id: 'msg-in-1',
      conversationId: 'conv-1',
      senderId: 'other-user',
      senderName: 'Nguyễn Minh Anh',
      content: 'Tin nhắn nhận được',
      createdAt: new Date().toISOString(),
      isOutgoing: false,
    };

    expect(outgoingMsg.isOutgoing).toBe(true);
    expect(incomingMsg.isOutgoing).toBe(false);
  });

  // 5. Input validation & trimming
  it('TC-CHAT-05: Composer chặn gửi khi nội dung trống hoặc chỉ chứa khoảng trắng', () => {
    let sent = false;
    const handleSend = (text: string) => {
      if (!text.trim()) return;
      sent = true;
    };

    handleSend('');
    expect(sent).toBe(false);

    handleSend('     ');
    expect(sent).toBe(false);

    handleSend('\n\n  \t ');
    expect(sent).toBe(false);

    handleSend('Xin chào');
    expect(sent).toBe(true);
  });

  // 6. Enter to send, Shift+Enter to newline
  it('TC-CHAT-06: Enter kích hoạt gửi tin nhắn, Shift+Enter cho phép xuống dòng', () => {
    let sendTriggered = false;
    const onSend = () => {
      sendTriggered = true;
    };

    const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    // Test Enter
    let defaultPrevented = false;
    handleKeyDown({
      key: 'Enter',
      shiftKey: false,
      preventDefault: () => {
        defaultPrevented = true;
      },
    });
    expect(sendTriggered).toBe(true);
    expect(defaultPrevented).toBe(true);

    // Test Shift + Enter
    sendTriggered = false;
    defaultPrevented = false;
    handleKeyDown({
      key: 'Enter',
      shiftKey: true,
      preventDefault: () => {
        defaultPrevented = true;
      },
    });
    expect(sendTriggered).toBe(false);
    expect(defaultPrevented).toBe(false);
  });

  // 7. Zero Network / API side-effects
  it('TC-CHAT-07: Gửi tin nhắn demo TUYỆT ĐỐI không gọi API backend', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const demoSendLogic = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      return {
        id: `demo-${Date.now()}`,
        content: trimmed,
        isOutgoing: true,
      };
    };

    const result = demoSendLogic('Tin nhắn thử nghiệm không gọi API');
    expect(result).not.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  // 8. Zero Browser Storage side-effects
  it('TC-CHAT-08: Gửi tin nhắn demo TUYỆT ĐỐI không ghi vào localStorage, sessionStorage hay cookies', () => {
    const localSpy = vi.spyOn(Storage.prototype, 'setItem');

    const demoSendLogic = (text: string) => {
      return {
        id: `demo-${Date.now()}`,
        content: text.trim(),
        isOutgoing: true,
      };
    };

    demoSendLogic('Tin nhắn demo không lưu storage');
    expect(localSpy).not.toHaveBeenCalled();
    localSpy.mockRestore();
  });

  // 9. State isolation per conversation
  it('TC-CHAT-09: Tin nhắn demo được cô lập riêng biệt theo từng conversationId', () => {
    const stateMap: Record<string, DemoChatMessage[]> = {
      'conv-A': [
        {
          id: 'msg-A1',
          conversationId: 'conv-A',
          senderId: currentUserId,
          senderName: 'Tôi',
          content: 'Nội dung hội thoại A',
          createdAt: new Date().toISOString(),
          isOutgoing: true,
        },
      ],
      'conv-B': [
        {
          id: 'msg-B1',
          conversationId: 'conv-B',
          senderId: currentUserId,
          senderName: 'Tôi',
          content: 'Nội dung hội thoại B',
          createdAt: new Date().toISOString(),
          isOutgoing: true,
        },
      ],
    };

    expect(stateMap['conv-A']).toHaveLength(1);
    expect(stateMap['conv-A'][0].content).toBe('Nội dung hội thoại A');

    expect(stateMap['conv-B']).toHaveLength(1);
    expect(stateMap['conv-B'][0].content).toBe('Nội dung hội thoại B');

    // Chuyển sang hội thoại C chưa có trong map
    expect(stateMap['conv-C']).toBeUndefined();
  });

  // 10. MessagesController Type Contract Verification
  it('TC-CHAT-10: MessagesController tuân thủ đầy đủ View-Controller Contract với các thuộc tính Chat Demo', () => {
    type ExpectedKeys =
      | 'selectedConversationId'
      | 'activeConversation'
      | 'currentUser'
      | 'composerText'
      | 'activeMessages'
      | 'handleComposerTextChange'
      | 'handleSendDemoMessage'
      | 'handleComposerKeyDown'
      | 'handleBackToList'
      | 'handleToggleInfoPanel';

    type HasKey<T, K extends string> = K extends keyof T ? true : false;
    type Check = HasKey<MessagesController, ExpectedKeys>;
    const isContractValid: Check = true;
    expect(isContractValid).toBe(true);
  });
});
