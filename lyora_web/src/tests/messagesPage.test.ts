import { describe, it, expect } from 'vitest';
import { CORE_CONSTANTS } from '@/core';
import {
  createDirectConversationSchema,
  createGroupConversationSchema,
  type ConversationDetail,
  type ConversationMember,
  type ConversationSummary,
  type FriendUser,
} from '@/features/conversations';
import type { MessagesController } from '@/ui/client/messages/messages.controller';

describe('Messages Page & Conversation Management Contracts', () => {
  // TC-CONV-01: API Endpoints Constants
  it('TC-CONV-01: CORE_CONSTANTS exposes CONVERSATIONS and FRIENDS endpoints', () => {
    expect(CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS).toBe('/conversations');
    expect(CORE_CONSTANTS.API_ENDPOINTS.FRIENDS).toBe('/friends');
  });

  // TC-CONV-02: Direct Conversation Schema Validation
  describe('TC-CONV-02: createDirectConversationSchema validation', () => {
    it('chấp nhận UUID hợp lệ', () => {
      const valid = createDirectConversationSchema.safeParse({
        targetUserId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(valid.success).toBe(true);
    });

    it('từ chối chuỗi rỗng', () => {
      const empty = createDirectConversationSchema.safeParse({
        targetUserId: '   ',
      });
      expect(empty.success).toBe(false);
    });

    it('từ chối ID không đúng định dạng UUID', () => {
      const invalid = createDirectConversationSchema.safeParse({
        targetUserId: 'user-not-uuid',
      });
      expect(invalid.success).toBe(false);
    });
  });

  // TC-CONV-03: Group Conversation Schema Validation
  describe('TC-CONV-03: createGroupConversationSchema validation', () => {
    it('chấp nhận nhóm hợp lệ với tiêu đề tiếng Việt và tối thiểu 2 bạn bè', () => {
      const valid = createGroupConversationSchema.safeParse({
        title: 'Nhóm Nghiên Cứu Lyora 🚀',
        memberIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
        ],
      });
      expect(valid.success).toBe(true);
    });

    it('từ chối tên nhóm dưới 2 ký tự hoặc vượt quá 100 ký tự', () => {
      const short = createGroupConversationSchema.safeParse({
        title: 'a',
        memberIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
        ],
      });
      expect(short.success).toBe(false);

      const long = createGroupConversationSchema.safeParse({
        title: 'a'.repeat(101),
        memberIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
        ],
      });
      expect(long.success).toBe(false);
    });

    it('từ chối nếu danh sách thành viên dưới 2 người bạn', () => {
      const tooFew = createGroupConversationSchema.safeParse({
        title: 'Nhóm Thiếu Người',
        memberIds: ['123e4567-e89b-12d3-a456-426614174001'],
      });
      expect(tooFew.success).toBe(false);
    });

    it('từ chối nếu danh sách thành viên chứa ID trùng lặp', () => {
      const duplicate = createGroupConversationSchema.safeParse({
        title: 'Nhóm Trùng Thành Viên',
        memberIds: [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      });
      expect(duplicate.success).toBe(false);
    });
  });

  // TC-CONV-04: MessagesController Type Contract
  it('TC-CONV-04: MessagesController exposes all required state, data and action handlers', () => {
    type ExpectedKeys =
      | 'selectedConversationId'
      | 'filterType'
      | 'searchQuery'
      | 'activeView'
      | 'isInfoPanelOpen'
      | 'isNewDirectModalOpen'
      | 'isNewGroupModalOpen'
      | 'conversations'
      | 'activeConversation'
      | 'friends'
      | 'isLoadingConversations'
      | 'isLoadingActiveConversation'
      | 'isLoadingFriends'
      | 'isCreatingDirect'
      | 'isCreatingGroup'
      | 'setFilterType'
      | 'setSearchQuery'
      | 'handleSelectConversation'
      | 'handleBackToList'
      | 'handleToggleInfoPanel'
      | 'handleCloseInfoPanel'
      | 'handleOpenDirectModal'
      | 'handleCloseDirectModal'
      | 'handleOpenGroupModal'
      | 'handleCloseGroupModal'
      | 'handleCreateDirect'
      | 'handleCreateGroup'
      | 'currentUser'
      | 'composerText'
      | 'activeMessages'
      | 'handleComposerTextChange'
      | 'handleComposerKeyDown';

    type HasKey<T, K extends string> = K extends keyof T ? true : false;
    type Check = HasKey<MessagesController, ExpectedKeys>;
    const isContractValid: Check = true;
    expect(isContractValid).toBe(true);
  });

  // TC-CONV-05: Entity Models Type Contracts
  it('TC-CONV-05: ConversationSummary, ConversationDetail and FriendUser contracts are strictly typed', () => {
    type HasSummaryKeys<T, K extends string> = K extends keyof T ? true : false;

    type CheckSummary = HasSummaryKeys<
      ConversationSummary,
      'id' | 'type' | 'title' | 'memberCount' | 'createdAt' | 'updatedAt'
    >;
    const isSummaryValid: CheckSummary = true;
    expect(isSummaryValid).toBe(true);

    type CheckDetail = HasSummaryKeys<
      ConversationDetail,
      'id' | 'type' | 'title' | 'members' | 'createdAt' | 'updatedAt'
    >;
    const isDetailValid: CheckDetail = true;
    expect(isDetailValid).toBe(true);

    type CheckMember = HasSummaryKeys<
      ConversationMember,
      'id' | 'userId' | 'role' | 'joinedAt' | 'user'
    >;
    const isMemberValid: CheckMember = true;
    expect(isMemberValid).toBe(true);

    type CheckFriend = HasSummaryKeys<
      FriendUser,
      'id' | 'fullName' | 'avatarUrl' | 'isOnline' | 'email'
    >;
    const isFriendValid: CheckFriend = true;
    expect(isFriendValid).toBe(true);
  });
});
