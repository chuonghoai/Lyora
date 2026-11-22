import React from 'react';
import { Button } from '@/core';
import { ChatBubbleOutlineIcon } from '../home/ClientIcons';
import { useMessagesPlaceholderController } from './messages-placeholder.controller';

export const MessagesPlaceholderView: React.FC = () => {
  const controller = useMessagesPlaceholderController();

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-14 px-3 sm:px-4">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm text-center space-y-6">
        {/* Visual Icon Container */}
        <div className="mx-auto inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-secondary-strong/60 bg-secondary/50 text-primary">
          <ChatBubbleOutlineIcon className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        {/* Header & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-secondary-strong/70 bg-secondary/40 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Đang phát triển</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {controller.title}
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed">
            Phân hệ quản lý hội thoại và tin nhắn trực tiếp đang được đội ngũ kỹ thuật Lyora hoàn thiện.
            Hiện tại, bạn có thể sử dụng khung chat nhanh ở góc dưới màn hình tại Bảng tin để kết nối với bạn bè.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={controller.handleBackToHome}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl min-h-[44px]"
          >
            Quay lại Bảng tin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessagesPlaceholderView;
