import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDate,
  Input,
  LoadingSpinner,
  LoadingState,
} from '@/core';
import { getClientProfilePath } from '@/routes/paths';
import {
  AvatarViolationButton,
  ViolationDetailModal,
  type ViolationModalTarget,
} from '@/ui/shared/ViolationIndicators';
import { useHomeController } from './home.controller';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { PostDetailModal } from './PostDetailModal';
import { PostEditModal } from './PostEditModal';
import { PostReactionsModal } from './PostReactionsModal';
import { AllFriendsModal } from './AllFriendsModal';
import { MediaLightboxModal } from './MediaLightboxModal';
import { PostAppealModal } from '../profile/PostAppealModal';
import {
  CalendarIcon,
  ChatBubbleOutlineIcon,
  EditIcon,
  GlobeIcon,
  ICON_SCALE_ANIMATION,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
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
  const [violationModalTarget, setViolationModalTarget] =
    useState<ViolationModalTarget | null>(null);
  const profileUser = controller.profileUser;
  const displayName = profileUser?.fullName?.trim() || 'Thành viên Lyora';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px] lg:gap-6 items-start">
      {/* CỘT TRÁI: Hồ sơ & Thông tin cá nhân */}
      <aside className="hidden lg:block sticky top-20 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Link
                to={getClientProfilePath(profileUser?.id)}
                className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {profileUser?.avatarUrl ? (
                  <AppImage
                    src={profileUser.avatarUrl}
                    alt={displayName}
                    rounded
                    className={`h-14 w-14 shrink-0 ${
                      profileUser.avatarViolation
                        ? 'border border-error ring-2 ring-error ring-offset-1 ring-offset-card'
                        : 'border border-border'
                    }`}
                  />
                ) : (
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-lg font-bold text-primary-active ${
                      profileUser?.avatarViolation
                        ? 'border border-error ring-2 ring-error ring-offset-1 ring-offset-card'
                        : 'border border-border'
                    }`}
                  >
                    {initials}
                  </span>
                )}
              </Link>
              {profileUser?.avatarViolation && (
                <AvatarViolationButton
                  size="md"
                  onClick={() =>
                    setViolationModalTarget({
                      kind: 'AVATAR',
                      subjectName: displayName,
                      reason: profileUser.avatarViolation!.reason,
                      flaggedAt: profileUser.avatarViolation!.flaggedAt,
                      evidenceUrl:
                        profileUser.avatarViolation!.evidenceUrl ??
                        profileUser.avatarUrl ??
                        null,
                    })
                  }
                />
              )}
            </div>
            <Link
              to={getClientProfilePath(profileUser?.id)}
              className="group min-w-0 flex-1 rounded-lg p-1 -m-1 hover:bg-background/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <p className="text-sm font-bold text-foreground group-hover:text-primary group-hover:underline truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted truncate">{profileUser?.email}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Đang hoạt động
              </span>
            </Link>
          </div>

          {profileUser?.bio && (
            <p className="text-xs text-muted leading-relaxed border-t border-border pt-2.5">
              {profileUser.bio}
            </p>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-2.5 border-t border-border text-center">
            <div className="rounded-xl bg-background px-1.5 py-2">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {controller.totalItems}
              </p>
              <p className="text-[11px] text-muted">Bài viết</p>
            </div>
            <div className="rounded-xl bg-background px-1.5 py-2">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {controller.friends.length}
              </p>
              <p className="text-[11px] text-muted">Bạn bè</p>
            </div>
          </div>

          <Link
            to={getClientProfilePath(profileUser?.id)}
            className="block w-full rounded-xl border border-border bg-background py-2 text-center text-xs font-semibold text-primary hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Mở trang cá nhân
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">
              Thông tin cá nhân
            </h2>
            {!controller.isEditingProfile && (
              <button
                type="button"
                onClick={controller.handleStartEditProfile}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          {!controller.isEditingProfile ? (
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MailIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Email</p>
                  <p className="font-medium text-foreground break-all">
                    {profileUser?.email || 'Chưa cập nhật'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <PhoneIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Số điện thoại</p>
                  <p className="font-medium text-foreground tabular-nums">
                    {profileUser?.phoneNumber || 'Chưa cập nhật'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <MapPinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Khu vực</p>
                  <p className="font-medium text-foreground">
                    {profileUser?.location || 'Chưa cập nhật'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <CalendarIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Tham gia Lyora</p>
                  <p className="font-medium text-foreground">
                    {profileUser?.createdAt
                      ? formatDate(profileUser.createdAt)
                      : 'Thành viên cộng đồng'}
                  </p>
                </div>
              </li>

              <li className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted">Trạng thái tài khoản</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    profileUser?.isActive === false
                      ? 'bg-error/10 text-error'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {profileUser?.isActive === false ? 'Tạm khóa' : 'Đã xác thực'}
                </span>
              </li>
            </ul>
          ) : (
            <form onSubmit={(e) => void controller.handleSaveProfile(e)} className="space-y-2.5">
              {controller.profileFormError && (
                <p role="alert" className="rounded-lg bg-error/10 px-2.5 py-1.5 text-xs text-error">
                  {controller.profileFormError}
                </p>
              )}

              <Input
                label="Họ và tên"
                name="fullName"
                value={controller.profileForm.fullName}
                onChange={controller.handleProfileFormChange}
                placeholder="Nhập họ và tên"
              />

              <Input
                label="Số điện thoại"
                name="phoneNumber"
                value={controller.profileForm.phoneNumber}
                onChange={controller.handleProfileFormChange}
                placeholder="Ví dụ: 0908123456"
              />

              <Input
                label="Khu vực"
                name="location"
                value={controller.profileForm.location}
                onChange={controller.handleProfileFormChange}
                placeholder="Ví dụ: TP. Hồ Chí Minh"
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="profile-bio-input" className="text-sm font-medium text-foreground">
                  Giới thiệu
                </label>
                <textarea
                  id="profile-bio-input"
                  name="bio"
                  rows={2}
                  value={controller.profileForm.bio}
                  onChange={controller.handleProfileFormChange}
                  placeholder="Mô tả ngắn về bạn..."
                  className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={controller.handleCancelEditProfile}
                  className="h-8 px-3 py-1 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={controller.isUpdatingProfile}
                  className="h-8 px-3 py-1 text-xs"
                >
                  Lưu
                </Button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* CỘT GIỮA: Bảng tin */}
      <div className="w-full lg:px-4 xl:px-8 2xl:px-12">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Bảng tin cộng đồng
            </h1>

            <div className="hidden lg:flex items-center gap-1.5">
              {(['ALL', 'PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => controller.handleSelectVisibilityFilter(opt)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                    controller.visibilityFilter === opt
                      ? 'border-primary bg-secondary text-primary-active font-semibold'
                      : 'border-border bg-card text-muted hover:text-foreground'
                  }`}
                >
                  {opt === 'ALL'
                    ? 'Tất cả'
                    : opt === 'PUBLIC'
                      ? 'Công khai'
                      : opt === 'FRIENDS'
                        ? 'Bạn bè'
                        : 'Riêng tư'}
                </button>
              ))}
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
              onClick={() => controller.handleSelectVisibilityFilter('FRIENDS')}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                controller.visibilityFilter === 'FRIENDS'
                  ? 'border-primary bg-secondary text-primary-active font-semibold'
                  : 'border-border bg-card text-muted'
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" />
              <span>Bạn bè</span>
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

          <PostComposer controller={controller} />

          {controller.isFeedLoading ? (
            <div className="space-y-4" aria-label="Đang tải bảng tin">
              <PostSkeletonCard />
              <PostSkeletonCard />
              <PostSkeletonCard />
            </div>
          ) : controller.isFeedError ? (
            <ErrorState
              title="Không thể tải danh sách bài viết"
              description="Vui lòng kiểm tra kết nối máy chủ hoặc thử tải lại bảng tin."
              onRetry={() => void controller.handleRefreshFeed()}
              isRetrying={controller.isFeedRefetching}
            />
          ) : controller.posts.length === 0 ? (
            controller.visibilityFilter !== 'ALL' ? (
              <EmptyState
                title="Không có bài viết phù hợp bộ lọc"
                description="Hiện chưa có bài viết nào ở chế độ hiển thị bạn vừa chọn."
                action={{
                  label: 'Xem tất cả bài viết',
                  onClick: controller.handleClearFilters,
                  variant: 'secondary',
                }}
              />
            ) : (
              <EmptyState
                title="Chưa có bài viết nào hiển thị"
                description="Hãy là người đầu tiên chia sẻ một khoảnh khắc mới lên cộng đồng Lyora."
                action={{
                  label: 'Viết bài đầu tiên',
                  onClick: controller.handleExpandComposer,
                  variant: 'primary',
                }}
              />
            )
          ) : (
            <div className="space-y-4">
              {controller.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  controller={controller}
                  onOpenAppealModal={controller.handleOpenAppealModal}
                />
              ))}

              <div ref={controller.loadMoreSentinelRef} className="py-4 text-center">
                {controller.isFetchingNextPage ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted shadow-sm">
                    <LoadingSpinner size="sm" />
                    <span>Đang tải thêm bài viết...</span>
                  </div>
                ) : controller.isFetchNextPageError ? (
                  <div className="inline-flex flex-col items-center gap-2">
                    <p className="text-xs text-error">Không thể tải thêm bài viết.</p>
                    <Button variant="outline" onClick={controller.handleLoadMore} className="text-xs">
                      Thử tải lại
                    </Button>
                  </div>
                ) : controller.hasNextPage ? (
                  <Button variant="outline" onClick={controller.handleLoadMore} className="text-xs">
                    Tải thêm bài viết
                  </Button>
                ) : controller.posts.length > 5 ? (
                  <p className="text-xs text-muted">
                    Bạn đã xem hết tất cả bài viết hiện có.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: Danh sách bạn bè */}
      <aside className="hidden xl:block sticky top-20 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">Danh sách bạn bè</h2>
              {!controller.isFriendsLoading && !controller.isFriendsError && (
                <span className="text-xs text-muted tabular-nums">({controller.friends.length})</span>
              )}
            </div>
            {controller.friends.length > 0 && (
              <button
                type="button"
                onClick={controller.handleOpenAllFriendsModal}
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Tất cả
              </button>
            )}
          </div>

          {controller.isFriendsLoading ? (
            <LoadingState variant="skeleton-list" count={3} label="Đang tải bạn bè..." />
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
              title="Chưa có bạn bè"
              description="Kết nối thêm bạn bè để dễ dàng trò chuyện và chia sẻ bài viết."
              action={{
                label: 'Tìm bạn bè',
                onClick: controller.handleOpenFriendsPage,
                variant: 'outline',
              }}
              className="border-none"
            />
          ) : (
            <ul className="space-y-1.5">
              {controller.friends.map((friend) => {
                const friendInitial = friend.fullName.charAt(0).toUpperCase();
                return (
                  <li key={friend.id}>
                    <div className="w-full flex items-center justify-between gap-2.5 rounded-xl px-2 py-1.5 hover:bg-background transition-colors">
                      <button
                        type="button"
                        onClick={() => controller.handleOpenUserProfile(friend.id)}
                        title={`Xem hồ sơ của ${friend.fullName}`}
                        className="group flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                          {friend.fullName}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={controller.isCreatingDirectChat}
                        onClick={() => void controller.handleOpenChatWithFriend(friend.id)}
                        aria-label={`Nhắn tin với ${friend.fullName}`}
                        title={`Nhắn tin với ${friend.fullName}`}
                        className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-transparent border-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ChatBubbleOutlineIcon
                          className={`w-5 h-5 text-primary group-hover:text-primary-hover ${ICON_SCALE_ANIMATION}`}
                        />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-1.5">
          <h2 className="text-xs font-semibold text-foreground">Không gian cộng đồng văn minh</h2>
          <p className="text-xs text-muted leading-relaxed">
            Hãy chia sẻ nội dung tích cực, tôn trọng quyền riêng tư và tương tác lành mạnh cùng bạn bè trên Lyora.
          </p>
        </div>
      </aside>

      <PostDetailModal controller={controller} />
      <PostEditModal
        post={controller.editingPost}
        friends={controller.friends}
        profileUser={controller.profileUser}
        onClose={controller.handleCloseEditPost}
        onOpenLightbox={controller.handleOpenLightbox}
      />
      <PostReactionsModal controller={controller} />
      <AllFriendsModal controller={controller} />
      <MediaLightboxModal controller={controller} />
      <PostAppealModal
        post={controller.appealTargetPost}
        isSubmitting={controller.isSubmittingAppeal}
        onClose={controller.handleCloseAppealModal}
        onSubmitAppeal={controller.handleSubmitPostAppeal}
      />
      <ViolationDetailModal
        target={violationModalTarget}
        onClose={() => setViolationModalTarget(null)}
      />
    </div>
  );
}

export { HomeView, HomeView as ClientHomeView };
