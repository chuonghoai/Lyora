import React from 'react';
import { AppImage, Button, formatDate, LoadingSpinner } from '@/core';
import {
  AcademicCapIcon,
  AtSignIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  EditIcon,
  GlobeIcon,
  HeartIcon,
  HomePinIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from '../home/ClientIcons';
import { PostCard } from '../home/PostCard';
import { PostComposer } from '../home/PostComposer';
import type { ProfileController } from './profile.controller';

export interface ProfileOverviewSectionProps {
  controller: ProfileController;
}

const ProfilePostSkeletonCard: React.FC = () => (
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
  </div>
);

export const ProfileOverviewSection: React.FC<ProfileOverviewSectionProps> = ({
  controller,
}) => {
  const profile = controller.profile;
  if (!profile) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_330px] 2xl:grid-cols-[330px_minmax(0,1fr)_350px] gap-5 items-start">
      {/* CỘT TRÁI: Giới thiệu bản thân, Thông số kết nối & Cụm 3 nút Dấu ấn gộp 1 chỗ */}
      <aside className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">Giới thiệu</h2>
            {controller.isOwnProfile ? (
              <button
                type="button"
                onClick={controller.handleOpenEditModal}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => controller.handleSelectTab('about')}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Xem chi tiết
              </button>
            )}
          </div>

          <p className="text-sm text-foreground leading-relaxed">
            {profile.bio?.trim() || 'Chưa cập nhật lời giới thiệu.'}
          </p>

          <ul className="space-y-3 pt-2 border-t border-border text-xs sm:text-sm">
            {profile.workplace && (
              <li className="flex items-start gap-2.5">
                <BriefcaseIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{profile.workplace}</span>
              </li>
            )}

            {profile.education && (
              <li className="flex items-start gap-2.5">
                <AcademicCapIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{profile.education}</span>
              </li>
            )}

            <li className="flex items-start gap-2.5">
              <MapPinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground">
                {profile.location ? `Sống tại ${profile.location}` : 'Chưa cập nhật khu vực'}
              </span>
            </li>

            {profile.hometown && (
              <li className="flex items-start gap-2.5">
                <HomePinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Đến từ {profile.hometown}</span>
              </li>
            )}

            {controller.isOwnProfile && (
              <>
                <li className="flex items-start gap-2.5">
                  <MailIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground break-all">
                    {profile.email || 'Chưa cập nhật email'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <PhoneIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground tabular-nums">
                    {profile.phoneNumber || 'Chưa cập nhật số điện thoại'}
                  </span>
                </li>
              </>
            )}

            {profile.website && (
              <li className="flex items-start gap-2.5">
                <LinkIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <a
                  href={
                    profile.website.startsWith('http')
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {profile.website}
                </a>
              </li>
            )}

            <li className="flex items-start gap-2.5">
              <CalendarIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-muted">
                Tham gia Lyora từ {formatDate(profile.createdAt)}
              </span>
            </li>
          </ul>
        </section>

        {/* Dải thông số kết nối */}
        <section
          aria-label="Thông số kết nối"
          className="rounded-2xl border border-border bg-card shadow-sm grid grid-cols-3 divide-x divide-border text-center"
        >
          <div className="p-3.5">
            <p className="text-xs font-medium text-muted">Bạn bè</p>
            <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
              {profile.friendsCount}
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-medium text-muted">
              {controller.isOwnProfile ? 'Lời mời mới' : 'Bạn chung'}
            </p>
            <p className="mt-1 text-lg font-bold text-primary tabular-nums">
              {controller.isOwnProfile
                ? controller.friendsTabCounts.incomingRequests
                : profile.mutualFriendsCount}
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-medium text-muted">Trạng thái</p>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-success">
              {profile.isOnline ? 'Trực tuyến' : 'Hoạt động'}
            </p>
          </div>
        </section>

        {/* Gôm 3 nút (Được chia sẻ / gắn thẻ, Yêu thích, Đã lưu bookmark) vào 1 chỗ */}
        <section
          aria-label={
            controller.isOwnProfile
              ? 'Dấu ấn cá nhân và bài viết đã lưu'
              : 'Bài viết được gắn thẻ'
          }
          className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {controller.isOwnProfile ? 'Dấu ấn & Đã lưu' : 'Hoạt động được gắn thẻ'}
              </h2>
              <p className="text-[11px] text-muted">
                {controller.isOwnProfile
                  ? 'Chia sẻ/gắn thẻ, bài viết yêu thích và đã lưu'
                  : `Các bài công khai có gắn thẻ ${profile.fullName}`}
              </p>
            </div>
          </div>

          {controller.isOwnProfile ? (
            <div
              role="group"
              aria-label="Truy cập nhanh dấu ấn và lưu trữ"
              className="rounded-xl border border-border bg-background/50 divide-y divide-border overflow-hidden"
            >
              <button
                type="button"
                onClick={() => controller.handleOpenActivityTab('tagged')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-card hover:text-primary transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <AtSignIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Được chia sẻ / Gắn thẻ</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 text-muted tabular-nums">
                  <span>{controller.activityCounts.tagged}</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => controller.handleOpenActivityTab('reacted')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-card hover:text-accent transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <HeartIcon className="w-4 h-4 text-accent shrink-0" />
                  <span className="truncate">Bài viết yêu thích</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 text-muted tabular-nums">
                  <span>{controller.activityCounts.reacted}</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => controller.handleOpenActivityTab('saved')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-card hover:text-primary transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <BookmarkIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Đã lưu bookmark</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 text-muted tabular-nums">
                  <span>{controller.activityCounts.saved}</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => controller.handleOpenActivityTab('tagged')}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-card hover:text-primary transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <AtSignIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">Xem bài được gắn thẻ</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 text-muted tabular-nums">
                <span>{controller.activityCounts.tagged}</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </section>
      </aside>

      {/* VÙNG GIỮA CHÍNH: Nơi viết bài viết (với hồ sơ của mình) & Danh sách bài viết đã đăng */}
      <section aria-label="Bài viết trên trang cá nhân" className="min-w-0 space-y-4">
        {controller.isOwnProfile && <PostComposer controller={controller} />}

        {/* Thanh đầu mục & lọc quyền riêng tư bài viết */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:px-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">
              {controller.isOwnProfile
                ? 'Bài viết của tôi'
                : `Bài viết của ${profile.fullName}`}
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary-active tabular-nums">
              {controller.totalItems}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => controller.handleSelectProfileVisibilityFilter('ALL')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                controller.profileVisibilityFilter === 'ALL'
                  ? 'border-primary bg-secondary text-primary-active font-semibold'
                  : 'border-border bg-card text-muted hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => controller.handleSelectProfileVisibilityFilter('PUBLIC')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                controller.profileVisibilityFilter === 'PUBLIC'
                  ? 'border-primary bg-secondary text-primary-active font-semibold'
                  : 'border-border bg-card text-muted hover:text-foreground'
              }`}
            >
              <GlobeIcon className="w-3.5 h-3.5" />
              <span>Công khai</span>
            </button>
            {controller.isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => controller.handleSelectProfileVisibilityFilter('FRIENDS')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                    controller.profileVisibilityFilter === 'FRIENDS'
                      ? 'border-primary bg-secondary text-primary-active font-semibold'
                      : 'border-border bg-card text-muted hover:text-foreground'
                  }`}
                >
                  <UsersIcon className="w-3.5 h-3.5" />
                  <span>Bạn bè</span>
                </button>
                <button
                  type="button"
                  onClick={() => controller.handleSelectProfileVisibilityFilter('PRIVATE')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                    controller.profileVisibilityFilter === 'PRIVATE'
                      ? 'border-primary bg-secondary text-primary-active font-semibold'
                      : 'border-border bg-card text-muted hover:text-foreground'
                  }`}
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  <span>Riêng tư</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => void controller.handleRefreshFeed()}
              disabled={controller.isFeedRefetching}
              aria-label="Làm mới bài viết"
              title="Làm mới"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted hover:bg-background hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Danh sách bài viết đã đăng */}
        {controller.isFeedLoading ? (
          <div className="space-y-4" aria-label="Đang tải bài viết hồ sơ">
            <ProfilePostSkeletonCard />
            <ProfilePostSkeletonCard />
          </div>
        ) : controller.isFeedError ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
            <p className="text-base font-semibold text-foreground">
              Không thể tải danh sách bài viết
            </p>
            <p className="text-xs sm:text-sm text-muted">
              Vui lòng kiểm tra kết nối máy chủ hoặc thử tải lại trang.
            </p>
            <Button variant="primary" onClick={() => void controller.handleRefreshFeed()}>
              Thử lại
            </Button>
          </div>
        ) : controller.posts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {controller.isOwnProfile
                ? controller.profileVisibilityFilter !== 'ALL'
                  ? 'Không có bài viết nào ở chế độ hiển thị này'
                  : 'Bạn chưa có bài viết nào trên trang cá nhân'
                : `${profile.fullName} chưa có bài viết công khai nào`}
            </p>
            <p className="text-xs text-muted">
              {controller.isOwnProfile
                ? 'Hãy chia sẻ suy nghĩ, hình ảnh hoặc khoảnh khắc mới ngay bằng khung viết bài ở trên.'
                : 'Các bài viết mới của thành viên này sẽ xuất hiện tại đây.'}
            </p>
            {controller.isOwnProfile && controller.profileVisibilityFilter === 'ALL' && (
              <div className="pt-1">
                <Button variant="primary" onClick={controller.handleExpandComposer}>
                  Viết bài đầu tiên
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {controller.posts.map((post) => (
              <PostCard key={post.id} post={post} controller={controller} />
            ))}

            <div ref={controller.loadMoreSentinelRef} className="py-3 text-center">
              {controller.isFetchingNextPage ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted shadow-sm">
                  <LoadingSpinner size="sm" />
                  <span>Đang tải thêm bài viết...</span>
                </div>
              ) : controller.hasNextPage ? (
                <Button
                  variant="outline"
                  onClick={controller.handleLoadMore}
                  className="text-xs"
                >
                  Tải thêm bài viết
                </Button>
              ) : (
                <p className="text-xs text-muted">
                  Đã hiển thị toàn bộ bài viết hiện có.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* CỘT PHẢI: Danh sách bạn bè & Kết nối cộng đồng */}
      <aside className="lg:col-span-2 xl:col-span-1 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Bạn bè</h2>
              <p className="text-xs text-muted tabular-nums">
                {profile.friendsCount} người bạn
                {!controller.isOwnProfile && profile.mutualFriendsCount > 0
                  ? ` · ${profile.mutualFriendsCount} bạn chung`
                  : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => controller.handleSelectTab('friends')}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              Tất cả
            </button>
          </div>

          {controller.overviewFriends.length === 0 ? (
            <div className="rounded-xl border border-border bg-background/60 p-5 text-center space-y-1.5">
              <UsersIcon className="w-5 h-5 text-muted mx-auto" />
              <p className="text-xs font-medium text-foreground">Chưa có bạn bè hiển thị</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {controller.overviewFriends.map((friend) => {
                const friendInitial = friend.fullName.charAt(0).toUpperCase();
                return (
                  <li key={friend.id}>
                    <button
                      type="button"
                      onClick={() => controller.handleOpenUserProfile(friend.id)}
                      className="w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-background transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="relative shrink-0">
                          {friend.avatarUrl ? (
                            <AppImage
                              src={friend.avatarUrl}
                              alt={friend.fullName}
                              rounded
                              className="h-9 w-9 border border-border"
                            />
                          ) : (
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active border border-border">
                              {friendInitial}
                            </span>
                          )}
                          {friend.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                            {friend.fullName}
                          </span>
                          <span className="block text-[11px] text-muted truncate tabular-nums">
                            {friend.mutualFriendsCount > 0
                              ? `${friend.mutualFriendsCount} bạn chung`
                              : friend.location || 'Thành viên Lyora'}
                          </span>
                        </span>
                      </span>

                      <ChevronRightIcon className="w-4 h-4 text-muted group-hover:text-primary shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {controller.isOwnProfile &&
          (controller.incomingRequests.length > 0 ||
            controller.suggestedConnections.length > 0) && (
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Lời mời & gợi ý kết nối
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    controller.handleSelectTab('friends');
                    controller.handleSelectFriendsFilter(
                      controller.incomingRequests.length > 0 ? 'REQUESTS' : 'SUGGESTIONS',
                    );
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Xem thêm
                </button>
              </div>

              <div className="space-y-2.5">
                {controller.incomingRequests.map((person) => (
                  <div
                    key={person.id}
                    className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => controller.handleOpenUserProfile(person.id)}
                      className="w-full flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
                    >
                      {person.avatarUrl ? (
                        <AppImage
                          src={person.avatarUrl}
                          alt={person.fullName}
                          rounded
                          className="h-9 w-9 shrink-0 border border-border"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">
                          {person.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                          {person.fullName}
                        </p>
                        <p className="text-[11px] text-muted truncate tabular-nums">
                          {person.mutualFriendsCount} bạn chung · Gửi lời mời
                        </p>
                      </div>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        disabled={controller.isFriendshipMutating}
                        onClick={() =>
                          void controller.handleAcceptFriendRequest(person.id, person.fullName)
                        }
                        className="h-8 px-2.5 py-1 text-xs gap-1"
                      >
                        <UserCheckIcon className="w-3.5 h-3.5" />
                        <span>Chấp nhận</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={controller.isFriendshipMutating}
                        onClick={() =>
                          void controller.handleRejectFriendRequest(person.id, person.fullName)
                        }
                        className="h-8 px-2.5 py-1 text-xs"
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ))}

                {controller.suggestedConnections.slice(0, 2).map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-border bg-background/50 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => controller.handleOpenUserProfile(person.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      {person.avatarUrl ? (
                        <AppImage
                          src={person.avatarUrl}
                          alt={person.fullName}
                          rounded
                          className="h-9 w-9 shrink-0 border border-border"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">
                          {person.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                          {person.fullName}
                        </p>
                        <p className="text-[11px] text-muted truncate tabular-nums">
                          {person.mutualFriendsCount > 0
                            ? `${person.mutualFriendsCount} bạn chung`
                            : person.location || 'Gợi ý kết nối'}
                        </p>
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={controller.isFriendshipMutating}
                      onClick={() =>
                        void controller.handleSendFriendRequest(person.id, person.fullName)
                      }
                      className="h-8 px-2.5 py-1 text-xs gap-1 shrink-0"
                    >
                      <UserPlusIcon className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
      </aside>
    </div>
  );
};
