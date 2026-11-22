import React from 'react';
import type { ConversationDetail } from '@/features/conversations';
import type { MessagesController } from '../messages.controller';
import { DirectConversationInfoPanel } from './DirectConversationInfoPanel';
import { GroupConversationInfoPanel } from './GroupConversationInfoPanel';

export interface ConversationInfoPanelProps {
  controller?: MessagesController;
  conversation?: ConversationDetail | null;
  onClose?: () => void;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  controller,
  conversation: propConversation,
  onClose: propOnClose,
}) => {
  // Ưu tiên trích xuất từ controller nếu có, fallback về direct props
  const conversation = controller
    ? controller.activeConversation
    : propConversation;

  const onClose = controller
    ? controller.handleCloseInfoPanel
    : propOnClose || (() => {});

  const currentUserId = controller?.currentUser?.id;
  const conversations = controller?.conversations || [];
  const onOpenGroupModal = controller?.handleOpenGroupModal;

  if (!conversation) return null;

  if (conversation.type === 'GROUP') {
    return (
      <GroupConversationInfoPanel
        conversation={conversation}
        onClose={onClose}
        currentUserId={currentUserId}
        controller={controller}
      />
    );
  }

  // Mặc định là DIRECT conversation
  return (
    <DirectConversationInfoPanel
      conversation={conversation}
      onClose={onClose}
      currentUserId={currentUserId}
      conversations={conversations}
      onOpenGroupModal={onOpenGroupModal}
    />
  );
};
