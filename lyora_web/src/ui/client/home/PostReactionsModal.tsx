import React from 'react';
import { createPortal } from 'react-dom';
import { Button, LoadingSpinner } from '@/core';
import { getReactionMeta, REACTION_OPTIONS } from '@/features/posts';
import type { HomeController } from './home.controller';
import { ChatBubbleOutlineIcon, CloseIcon } from './ClientIcons';
import { PostAvatarChip } from './PostCard';

export interface PostReactionsModalProps {
  controller: HomeController;
}

export const PostReactionsModal: React.FC<PostReactionsModalProps> = ({ controller }) => {
  const post = controller.reactionsModalPost;
  const modalState = controller.reactionsPopover;

  if (!post || !modalState || typeof document === 'undefined') {
    return null;
  }

  const activeFilterType = modalState.reactionType;
  const reactionsData = controller.reactionsData;

  const sortedReactionTabs = REACTION_OPTIONS.filter(
    (opt) => (post.reactionBreakdown[opt.type] ?? 0) > 0,
  ).sort(
    (a, b) => (post.reactionBreakdown[b.type] ?? 0) - (post.reactionBreakdown[a.type] ?? 0),
  );

  const friendIds = new Set(controller.friends.map((friend) => friend.id));

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thông số lượt thích và cảm xúc bài viết"
      onClick={controller.handleCloseReactionsModal}
      className="fixed inset-0 z-[55] bg-foreground/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[82vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        {/* Header kiểu Facebook */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 pt-3.5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Lượt thích &amp; cảm xúc
            </h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary-active tabular-nums">
              {post.reactionCount}
            </span>
          </div>

          <button
            type="button"
            onClick={controller.handleCloseReactionsModal}
            aria-label="Đóng danh sách cảm xúc"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Thanh Tabs lọc cảm xúc có gạch chân active giống Facebook */}
        <div
          role="tablist"
          aria-label="Phân loại theo biểu tượng cảm xúc"
          className="shrink-0 flex items-center gap-1 overflow-x-auto border-b border-border px-3 sm:px-5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!activeFilterType}
            onClick={() => controller.handleChangeReactionsFilter(undefined)}
            className={`shrink-0 inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              !activeFilterType
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            <span>Tất cả</span>
            <span className="tabular-nums text-xs">({post.reactionCount})</span>
          </button>

          {sortedReactionTabs.map((opt) => (
            <button
              key={opt.type}
              type="button"
              role="tab"
              aria-selected={activeFilterType === opt.type}
              onClick={() => controller.handleChangeReactionsFilter(opt.type)}
              className={`shrink-0 inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeFilterType === opt.type
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="tabular-nums">{post.reactionBreakdown[opt.type]}</span>
            </button>
          ))}
        </div>

        {/* Danh sách người bày tỏ cảm xúc */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {controller.isReactionsLoading && !reactionsData ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-muted">
              <LoadingSpinner size="md" />
              <span>Đang tải danh sách cảm xúc...</span>
            </div>
          ) : !reactionsData || reactionsData.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Chưa có lượt bày tỏ cảm xúc nào trong mục này.
            </p>
          ) : (
            reactionsData.items.map((item) => {
              const meta = getReactionMeta(item.reactionType);
              const isSelf =
                item.user.id === controller.profileUser?.id ||
                (controller.profileUser?.email &&
                  item.user.email === controller.profileUser.email);
              const isFriend = friendIds.has(item.user.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <PostAvatarChip
                        name={item.user.fullName}
                        avatarUrl={item.user.avatarUrl}
                        sizeClass="h-10 w-10 text-xs"
                      />
                      <span
                        title={meta.label}
                        className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-card shadow-sm text-xs"
                      >
                        {meta.emoji}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.user.fullName}
                      </p>
                      <p className="text-xs text-muted">{meta.label}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelf ? (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary-active">
                        Bạn
                      </span>
                    ) : isFriend ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          controller.handleCloseReactionsModal();
                          controller.handleOpenChatWithFriend(item.user.id);
                        }}
                        className="h-8 px-3 py-1 text-xs gap-1.5"
                      >
                        <ChatBubbleOutlineIcon className="w-4 h-4" />
                        <span>Nhắn tin</span>
                      </Button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.activeBgClass} ${meta.activeTextClass}`}
                      >
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer phân trang */}
        {reactionsData && reactionsData.meta.totalPages > 1 && (
          <footer className="shrink-0 border-t border-border bg-background/40 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted tabular-nums">
              Trang <strong className="text-foreground">{reactionsData.meta.page}</strong> /{' '}
              {reactionsData.meta.totalPages} ({reactionsData.meta.totalItems} người)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!reactionsData.meta.hasPrevPage || controller.isReactionsLoading}
                onClick={() =>
                  controller.handleChangeReactionsPage(reactionsData.meta.page - 1)
                }
                className="h-8 px-3 py-1 text-xs"
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!reactionsData.meta.hasNextPage || controller.isReactionsLoading}
                onClick={() =>
                  controller.handleChangeReactionsPage(reactionsData.meta.page + 1)
                }
                className="h-8 px-3 py-1 text-xs"
              >
                Sau
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
