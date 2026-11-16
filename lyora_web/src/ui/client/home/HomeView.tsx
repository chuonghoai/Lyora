import React from 'react';
import { AppImage, Button, LoadingSpinner } from '@/core';
import { useHomeController } from './home.controller';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { PostDetailModal } from './PostDetailModal';
import { FriendChatWidget } from './FriendChatWidget';
import {
  BookmarkIcon,
  ChatBubbleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  GlobeIcon,
  HomeFeedIcon,
  LockIcon,
  RefreshIcon,
  UserCircleIcon,
} from './ClientIcons';

const PostSkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-secondary/50 animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-3.5 w-36 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="h-3 w-24 rounded-lg bg-border/70 animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3.5 w-full rounded-lg bg-border/70 animate-pulse" />
      <div className="h-3.5 w-5/6 rounded-lg bg-border/70 animate-pulse" />
    </div>
    <div className="h-52 w-full rounded-xl bg-secondary/40 animate-pulse" />
  </div>
);

export default function HomeView(): React.ReactElement {
  const controller = useHomeController();
  const displayName = controller.currentUser?.fullName?.trim() || 'Thành viên Lyora';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:gap-6 items-start">
      {/* CỘT TRÁI: Thông tin cá nhân & Bộ lọc điều hướng */}
      <aside className="hidden lg:block sticky top-20 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            {controller.currentUser?.avatarUrl ? (
              <AppImage
                src={controller.currentUser.avatarUrl}
                alt={displayName}
                rounded
                className="h-12 w-12 shrink-0 border border-border"
              />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-base font-bold text-primary-active border border-border">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{controller.currentUser?.email}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Đang hoạt động
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
            <div className="rounded-xl bg-background px-2 py-2">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {controller.totalItems}
              </p>
              <p className="text-[11px] text-muted">Bài hiển thị</p>
            </div>
            <div className="rounded-xl bg-background px-2 py-2">
              <p className="text-sm font-bold text-primary tabular-nums">
                {controller.savedPostsCount}
              </p>
              <p className="text-[11px] text-muted">Đã lưu</p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Phân loại bảng tin"
          className="rounded-2xl border border-border bg-card p-2.5 shadow-sm space-y-1"
        >
          <button
            type="button"
            onClick={() => controller.handleSelectTab('all')}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
              controller.activeTab === 'all'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground font-medium'
            }`}
          >
            <HomeFeedIcon className="w-5 h-5" />
            <span>Bảng tin cộng đồng</span>
          </button>

          <button
            type="button"
            onClick={() => controller.handleSelectTab('mine')}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
              controller.activeTab === 'mine'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground font-medium'
            }`}
          >
            <UserCircleIcon className="w-5 h-5" />
            <span>Bài viết của tôi</span>
          </button>

          <button
            type="button"
            onClick={() => controller.handleSelectTab('saved')}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
              controller.activeTab === 'saved'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground font-medium'
            }`}
          >
            <BookmarkIcon className="w-5 h-5" filled={controller.activeTab === 'saved'} />
            <span>Bài viết đã lưu</span>
          </button>
        </nav>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2.5">
          <p className="text-xs font-semibold text-foreground">Chế độ hiển thị</p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => controller.handleSelectVisibilityFilter('ALL')}
              className={`text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                controller.visibilityFilter === 'ALL'
                  ? 'bg-secondary text-primary-active font-semibold'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              Tất cả bài viết
            </button>
            <button
              type="button"
              onClick={() => controller.handleSelectVisibilityFilter('PUBLIC')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                controller.visibilityFilter === 'PUBLIC'
                  ? 'bg-secondary text-primary-active font-semibold'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <GlobeIcon className="w-3.5 h-3.5" />
              <span>Chỉ bài công khai</span>
            </button>
            <button
              type="button"
              onClick={() => controller.handleSelectVisibilityFilter('PRIVATE')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                controller.visibilityFilter === 'PRIVATE'
                  ? 'bg-secondary text-primary-active font-semibold'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>Chỉ bài riêng tư</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CỘT GIỮA: Thanh làm mới + Khung đăng bài + Newsfeed */}
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {/* Thanh trạng thái bảng tin & nút Làm mới */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              {controller.activeTab === 'mine'
                ? 'Bài viết của tôi'
                : controller.activeTab === 'saved'
                  ? 'Bài viết đã lưu'
                  : 'Bảng tin cộng đồng'}
            </h1>
            {controller.isPreviewFallback && (
              <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
                Giao diện xem trước
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(controller.debouncedSearch ||
              controller.visibilityFilter !== 'ALL' ||
              controller.activeTab !== 'all') && (
              <Button
                variant="ghost"
                onClick={controller.handleClearFilters}
                className="h-8 px-2.5 py-1 text-xs"
              >
                Xóa lọc
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => void controller.handleRefreshFeed()}
              isLoading={controller.isFeedRefetching}
              className="h-8 px-3 py-1 text-xs gap-1.5"
            >
              {!controller.isFeedRefetching && <RefreshIcon className="w-3.5 h-3.5 text-muted" />}
              <span>Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Filter Visibility trên Mobile/Tablet */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => controller.handleSelectVisibilityFilter('ALL')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              controller.visibilityFilter === 'ALL'
                ? 'border-primary bg-secondary text-primary-active font-semibold'
                : 'border-border bg-card text-muted'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => controller.handleSelectVisibilityFilter('PUBLIC')}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              controller.visibilityFilter === 'PUBLIC'
                ? 'border-primary bg-secondary text-primary-active font-semibold'
                : 'border-border bg-card text-muted'
            }`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            <span>Công khai</span>
          </button>
          <button
            type="button"
            onClick={() => controller.handleSelectVisibilityFilter('PRIVATE')}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              controller.visibilityFilter === 'PRIVATE'
                ? 'border-primary bg-secondary text-primary-active font-semibold'
                : 'border-border bg-card text-muted'
            }`}
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span>Riêng tư</span>
          </button>
        </div>

        {/* Khung tạo bài viết */}
        <PostComposer controller={controller} />

        {/* Danh sách bài viết (Feed) */}
        {controller.isFeedLoading ? (
          <div className="space-y-4" aria-label="Đang tải bảng tin">
            <PostSkeletonCard />
            <PostSkeletonCard />
            <PostSkeletonCard />
          </div>
        ) : controller.isFeedError ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
            <p className="text-base font-semibold text-foreground">
              Không thể tải danh sách bài viết
            </p>
            <p className="text-sm text-muted">
              Vui lòng kiểm tra kết nối máy chủ hoặc thử tải lại bảng tin.
            </p>
            <Button variant="primary" onClick={() => void controller.handleRefreshFeed()}>
              Thử lại
            </Button>
          </div>
        ) : controller.posts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
            <p className="text-base font-semibold text-foreground">
              {controller.activeTab === 'saved'
                ? 'Bạn chưa lưu bài viết nào'
                : controller.debouncedSearch
                  ? `Không tìm thấy bài viết khớp với "${controller.debouncedSearch}"`
                  : 'Chưa có bài viết nào hiển thị'}
            </p>
            <p className="text-sm text-muted">
              {controller.activeTab === 'saved'
                ? 'Nhấn nút Lưu trên các bài viết yêu thích để xem lại nhanh tại đây.'
                : 'Hãy là người đầu tiên chia sẻ một khoảnh khắc mới lên cộng đồng Lyora.'}
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              {controller.activeTab !== 'all' || controller.debouncedSearch || controller.visibilityFilter !== 'ALL' ? (
                <Button variant="secondary" onClick={controller.handleClearFilters}>
                  Về bảng tin chính
                </Button>
              ) : (
                <Button variant="primary" onClick={() => controller.handleExpandComposer()}>
                  Viết bài đầu tiên
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {controller.posts.map((post) => (
              <PostCard key={post.id} post={post} controller={controller} />
            ))}

            {/* Điểm neo Infinite Scroll tự động tải thêm khi kéo xuống cuối trang */}
            <div ref={controller.loadMoreSentinelRef} className="py-4 text-center">
              {controller.isFetchingNextPage ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted shadow-sm">
                  <LoadingSpinner size="sm" />
                  <span>Đang tải thêm bài viết...</span>
                </div>
              ) : controller.hasNextPage ? (
                <Button variant="outline" onClick={controller.handleLoadMore} className="text-xs">
                  Tải thêm bài viết
                </Button>
              ) : (
                <p className="text-xs text-muted">
                  Bạn đã xem hết tất cả bài viết hiện có.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: Danh sách bạn bè & Lưu trữ nhanh */}
      <aside className="hidden xl:block sticky top-20 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Danh sách bạn bè</h2>
            <span className="text-xs text-muted">{controller.friends.length} người</span>
          </div>

          {controller.friends.length === 0 ? (
            <p className="text-xs text-muted">Chưa có bạn bè đang hoạt động.</p>
          ) : (
            <ul className="space-y-1.5">
              {controller.friends.map((friend) => {
                const friendInitial = friend.fullName.charAt(0).toUpperCase();
                return (
                  <li key={friend.id}>
                    <div className="w-full flex items-center justify-between gap-2.5 rounded-xl px-2 py-1.5 hover:bg-background transition-colors">
                      <button
                        type="button"
                        onClick={() => controller.handleOpenChatWithFriend(friend.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span className="relative shrink-0">
                          {friend.avatarUrl ? (
                            <AppImage
                              src={friend.avatarUrl}
                              alt={friend.fullName}
                              rounded
                              className="h-9 w-9 border border-border"
                            />
                          ) : (
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">
                              {friendInitial}
                            </span>
                          )}
                          {friend.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                          )}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {friend.fullName}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => controller.handleOpenChatWithFriend(friend.id)}
                        aria-label={`Nhắn tin với ${friend.fullName}`}
                        title={`Nhắn tin với ${friend.fullName}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ChatBubbleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4 text-primary" filled />
            <h2 className="text-sm font-semibold text-foreground">Kho bài viết đã lưu</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Hiện có <strong className="text-foreground">{controller.savedPostsCount}</strong> bài viết
            đã đánh dấu trong bảng tin hiện tại.
          </p>
          <Button
            variant="secondary"
            onClick={() => controller.handleSelectTab('saved')}
            className="w-full text-xs"
          >
            Mở danh sách đã lưu
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1.5">
          <h2 className="text-xs font-semibold text-foreground">Không gian cộng đồng văn minh</h2>
          <p className="text-xs text-muted leading-relaxed">
            Hãy chia sẻ nội dung tích cực, tôn trọng quyền riêng tư và tương tác lành mạnh cùng bạn bè trên Lyora.
          </p>
        </div>
      </aside>

      {/* Modal chi tiết 1 bài viết nổi bật kèm danh sách bình luận mở rộng */}
      <PostDetailModal controller={controller} />

      {/* Hộp nhắn tin bạn bè góc phải dưới */}
      <FriendChatWidget controller={controller} />

      {/* Lightbox xem ảnh phóng to */}
      {controller.lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
          onClick={controller.handleCloseLightbox}
          className="fixed inset-0 z-50 bg-foreground/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={controller.handleCloseLightbox}
            aria-label="Đóng xem ảnh"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>

          {controller.lightbox.items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                controller.handlePrevLightbox();
              }}
              aria-label="Ảnh trước"
              className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
          >
            <AppImage
              src={controller.lightbox.items[controller.lightbox.index]?.url}
              alt={controller.lightbox.items[controller.lightbox.index]?.alt || 'Ảnh bài viết'}
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain bg-card"
            />
            <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground tabular-nums">
              {controller.lightbox.index + 1} / {controller.lightbox.items.length}
            </span>
          </div>

          {controller.lightbox.items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                controller.handleNextLightbox();
              }}
              aria-label="Ảnh tiếp theo"
              className="absolute right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { HomeView, HomeView as ClientHomeView };
