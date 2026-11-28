import React from 'react';
import { createPortal } from 'react-dom';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
} from '@/core';
import type { HomeController } from './home.controller';
import { ChatBubbleOutlineIcon, CloseIcon, SearchIcon, UsersIcon } from './ClientIcons';

export interface AllFriendsModalProps {
  controller: HomeController;
}

export const AllFriendsModal: React.FC<AllFriendsModalProps> = ({ controller }) => {
  if (!controller.isAllFriendsModalOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tất cả bạn bè"
      onClick={controller.handleCloseAllFriendsModal}
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[82vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Tất cả bạn bè</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary-active tabular-nums">
              {controller.friends.length}
            </span>
          </div>

          <button
            type="button"
            onClick={controller.handleCloseAllFriendsModal}
            aria-label="Đóng danh sách tất cả bạn bè"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <div className="shrink-0 p-3 sm:px-4 border-b border-border bg-background/40">
          <Input
            type="search"
            value={controller.friendSearchQuery}
            onChange={controller.handleFriendSearchChange}
            placeholder="Tìm kiếm bạn bè theo tên..."
            aria-label="Tìm kiếm trong danh sách bạn bè"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {controller.isFriendsLoading ? (
            <LoadingState variant="skeleton-list" count={3} label="Đang tải danh sách bạn bè..." />
          ) : controller.isFriendsError ? (
            <ErrorState
              compact
              title="Không thể tải danh sách bạn bè"
              description="Vui lòng thử lại."
              onRetry={controller.handleRetryFriends}
            />
          ) : controller.friends.length === 0 ? (
            <EmptyState
              compact
              icon={<UsersIcon className="w-5 h-5" />}
              title="Bạn chưa có bạn bè nào"
              description="Hãy kết nối với bạn bè để bắt đầu trò chuyện."
              action={{
                label: 'Tìm bạn bè',
                onClick: controller.handleOpenFriendsPage,
                variant: 'outline',
              }}
            />
          ) : controller.filteredFriends.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchIcon className="w-5 h-5" />}
              title="Không tìm thấy bạn bè phù hợp"
              description={`Không có bạn bè nào khớp với "${controller.friendSearchQuery.trim()}".`}
              action={{
                label: 'Xóa tìm kiếm',
                onClick: controller.handleClearFriendSearch,
                variant: 'outline',
              }}
            />
          ) : (
            controller.filteredFriends.map((friend) => {
              const initial = friend.fullName.charAt(0).toUpperCase();
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 hover:bg-background transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => controller.handleOpenUserProfile(friend.id)}
                    className="group flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="relative shrink-0">
                      {friend.avatarUrl ? (
                        <AppImage
                          src={friend.avatarUrl}
                          alt={friend.fullName}
                          rounded
                          className="h-10 w-10 border border-border"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active border border-border">
                          {initial}
                        </span>
                      )}
                      {friend.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                        {friend.fullName}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          friend.isOnline ? 'text-success' : 'text-muted'
                        }`}
                      >
                        {friend.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                      </p>
                    </div>
                  </button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={controller.isCreatingDirectChat}
                    onClick={() => {
                      controller.handleCloseAllFriendsModal();
                      void controller.handleOpenChatWithFriend(friend.id);
                    }}
                    className="h-8 px-3 py-1 text-xs gap-1.5 shrink-0"
                  >
                    <ChatBubbleOutlineIcon className="w-4 h-4" />
                    <span>Nhắn tin</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
