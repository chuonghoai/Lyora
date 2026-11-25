import React from 'react';
import { AppImage, Button, formatDate, formatDateTime, formatRelativeTime } from '@/core';
import {
  AcademicCapIcon,
  AtSignIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  CommentIcon,
  EditIcon,
  GlobeIcon,
  HeartIcon,
  HomePinIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  ThumbUpIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileOverviewSectionProps {
  controller: ProfileController;
}

export const ProfileOverviewSection: React.FC<ProfileOverviewSectionProps> = ({
  controller,
}) => {
  const profile = controller.profile;
  if (!profile) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_330px] 2xl:grid-cols-[330px_minmax(0,1fr)_350px] gap-5 items-start">
      {/* CỘT TRÁI: Giới thiệu bản thân & Thông số hồ sơ */}
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
      </aside>

      {/* CỘT GIỮA: Dấu ấn tương tác & Bài viết liên quan (1 thanh 3 nút tách biệt với tab Của tôi) */}
      <section
        aria-label="Hoạt động bài viết liên quan"
        className="min-w-0 space-y-4"
      >
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {controller.isOwnProfile
                  ? 'Dấu ấn tương tác & chia sẻ'
                  : `Hoạt động của ${profile.fullName}`}
              </h2>
              <p className="text-xs text-muted">
                {controller.isOwnProfile
                  ? 'Các bài viết gắn thẻ bạn, bạn đã thích hoặc đã lưu. Bài do bạn đăng nằm tại mục Của tôi.'
                  : 'Bài viết công khai và nội dung thành viên này được gắn thẻ.'}
              </p>
            </div>

            {controller.isOwnProfile && (
              <button
                type="button"
                onClick={controller.handleNavigateToMyPosts}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
              >
                <span>Bài viết Của tôi</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Thanh 1 tab gồm 3 nút (Hồ sơ cá nhân) hoặc 2 nút công khai (Hồ sơ người khác) */}
          {controller.isOwnProfile ? (
            <div
              role="tablist"
              aria-label="Lọc dấu ấn bài viết trên hồ sơ"
              className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-background p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={controller.activityTab === 'tagged'}
                onClick={() => controller.handleSelectActivityTab('tagged')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  controller.activityTab === 'tagged'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <AtSignIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Gắn thẻ & Chia sẻ</span>
                <span className="hidden sm:inline text-[11px] font-medium text-muted tabular-nums">
                  ({controller.activityCounts.tagged})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={controller.activityTab === 'reacted'}
                onClick={() => controller.handleSelectActivityTab('reacted')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  controller.activityTab === 'reacted'
                    ? 'bg-card text-accent shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <HeartIcon
                  className="w-4 h-4 shrink-0"
                  filled={controller.activityTab === 'reacted'}
                />
                <span className="truncate">Đã thích</span>
                <span className="hidden sm:inline text-[11px] font-medium text-muted tabular-nums">
                  ({controller.activityCounts.reacted})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={controller.activityTab === 'saved'}
                onClick={() => controller.handleSelectActivityTab('saved')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  controller.activityTab === 'saved'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <BookmarkIcon
                  className="w-4 h-4 shrink-0"
                  filled={controller.activityTab === 'saved'}
                />
                <span className="truncate">Đã lưu</span>
                <span className="hidden sm:inline text-[11px] font-medium text-muted tabular-nums">
                  ({controller.activityCounts.saved})
                </span>
              </button>
            </div>
          ) : (
            <div
              role="tablist"
              aria-label="Lọc bài viết công khai trên hồ sơ thành viên"
              className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={controller.activityTab === 'authored'}
                onClick={() => controller.handleSelectActivityTab('authored')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  controller.activityTab === 'authored'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <GlobeIcon className="w-4 h-4 shrink-0" />
                <span>Bài viết công khai</span>
                <span className="text-[11px] font-medium text-muted tabular-nums">
                  ({controller.activityCounts.authored})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={controller.activityTab === 'tagged'}
                onClick={() => controller.handleSelectActivityTab('tagged')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  controller.activityTab === 'tagged'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <AtSignIcon className="w-4 h-4 shrink-0" />
                <span>Được gắn thẻ</span>
                <span className="text-[11px] font-medium text-muted tabular-nums">
                  ({controller.activityCounts.tagged})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Danh sách bài viết trong tab đang chọn */}
        {controller.isLoadingActivity ? (
          <div className="space-y-4">
            <div className="h-44 rounded-2xl border border-border bg-card animate-pulse" />
            <div className="h-44 rounded-2xl border border-border bg-card animate-pulse" />
          </div>
        ) : controller.activityItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Chưa có bài viết nào trong mục này
            </p>
            <p className="text-xs text-muted">
              {controller.activityTab === 'tagged'
                ? 'Các bài viết bạn được gắn thẻ hoặc chia sẻ tới bạn sẽ xuất hiện tại đây.'
                : controller.activityTab === 'reacted'
                  ? 'Những bài viết bạn bày tỏ cảm xúc trên bảng tin sẽ hiển thị ở đây.'
                  : controller.activityTab === 'saved'
                    ? 'Các bài viết bạn đánh dấu lưu sẽ tập hợp tại đây để xem lại nhanh.'
                    : 'Thành viên này chưa có bài viết công khai nào.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {controller.activityItems.map((item) => {
              const authorInitial = item.author.fullName.charAt(0).toUpperCase();
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3"
                >
                  {/* Ngữ cảnh nguồn bài viết */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        item.kind === 'REACTED'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-secondary text-primary-active'
                      }`}
                    >
                      {item.kind === 'REACTED' ? (
                        <HeartIcon className="w-3 h-3" filled />
                      ) : item.kind === 'SAVED' ? (
                        <BookmarkIcon className="w-3 h-3" filled />
                      ) : item.kind === 'SHARED_TO_ME' ? (
                        <ShareIcon className="w-3 h-3" />
                      ) : (
                        <AtSignIcon className="w-3 h-3" />
                      )}
                      <span>{item.contextLabel}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      {item.visibility === 'FRIENDS' ? (
                        <>
                          <UsersIcon className="w-3.5 h-3.5 text-info" />
                          <span>Bạn bè</span>
                        </>
                      ) : (
                        <>
                          <GlobeIcon className="w-3.5 h-3.5" />
                          <span>Công khai</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Tác giả bài viết (nhấn vào mở hồ sơ tác giả) */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => controller.handleOpenUserProfile(item.author.id)}
                      className="shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {item.author.avatarUrl ? (
                        <AppImage
                          src={item.author.avatarUrl}
                          alt={item.author.fullName}
                          rounded
                          className="h-10 w-10 border border-border"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active border border-border">
                          {authorInitial}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => controller.handleOpenUserProfile(item.author.id)}
                        className="text-sm font-semibold text-foreground hover:text-primary hover:underline truncate cursor-pointer block text-left"
                      >
                        {item.author.fullName}
                      </button>
                      <time
                        dateTime={item.createdAt}
                        title={formatDateTime(item.createdAt)}
                        className="text-xs text-muted block"
                      >
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </div>
                  </div>

                  {/* Nội dung bài */}
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {item.content}
                  </p>

                  {item.mediaPreviewUrl && (
                    <div className="overflow-hidden rounded-xl border border-border bg-background">
                      <AppImage
                        src={item.mediaPreviewUrl}
                        alt={item.mediaPreviewAlt || 'Hình ảnh bài viết'}
                        className="w-full max-h-64 rounded-none object-cover"
                      />
                    </div>
                  )}

                  {/* Tóm tắt số liệu tương tác (chỉ đọc) */}
                  <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <ThumbUpIcon className="w-3.5 h-3.5 text-primary" />
                      <span>{item.reactionCount} cảm xúc</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <CommentIcon className="w-3.5 h-3.5" />
                        <span>{item.commentCount} bình luận</span>
                      </span>
                      <span>{item.shareCount} chia sẻ</span>
                    </div>
                  </div>
                </article>
              );
            })}
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
                          <span className="block text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary truncate">
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
                        <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary truncate">
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
                        <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary truncate">
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
