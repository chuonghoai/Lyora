import React from 'react';
import { AppImage, Button, formatDate } from '@/core';
import { PROFILE_COVER_PRESETS } from '@/features/user';
import {
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  ChatBubbleOutlineIcon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  EditIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileHeaderProps {
  controller: ProfileController;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ controller }) => {
  const profile = controller.profile;
  if (!profile) return null;

  const displayName = profile.fullName.trim() || 'Thành viên Lyora';
  const initials = displayName
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'L';

  const coverSrc = profile.coverUrl || PROFILE_COVER_PRESETS[0].url;

  return (
    <section
      aria-label="Thông tin tổng quan hồ sơ"
      className="rounded-2xl border border-border bg-card shadow-sm overflow-visible"
    >
      {/* Ảnh bìa */}
      <div className="relative h-44 sm:h-56 lg:h-64 w-full overflow-hidden rounded-t-2xl bg-secondary border-b border-border">
        <AppImage
          src={coverSrc}
          alt={`Ảnh bìa của ${displayName}`}
          className="h-full w-full rounded-none object-cover"
        />

        {controller.isOwnProfile && (
          <button
            type="button"
            onClick={controller.handleOpenEditModal}
            className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CameraIcon className="w-4 h-4 text-primary" />
            <span>Đổi ảnh bìa</span>
          </button>
        )}
      </div>

      {/* Khối nhận diện & hành động (nằm hoàn toàn dưới ảnh bìa, chỉ Avatar nổi lên mép ảnh bìa) */}
      <div className="px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative -mt-12 sm:-mt-16 z-10 w-fit shrink-0">
              {profile.avatarUrl ? (
                <AppImage
                  src={profile.avatarUrl}
                  alt={displayName}
                  rounded
                  className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-card bg-secondary shadow-sm"
                />
              ) : (
                <span className="grid h-24 w-24 sm:h-32 sm:w-32 place-items-center rounded-full border-4 border-card bg-secondary text-2xl sm:text-3xl font-bold text-primary-active shadow-sm">
                  {initials}
                </span>
              )}

              {profile.isOnline && (
                <span
                  title="Đang hoạt động"
                  className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-success ring-2 ring-card"
                />
              )}

              {controller.isOwnProfile && (
                <button
                  type="button"
                  onClick={controller.handleOpenEditModal}
                  aria-label="Cập nhật ảnh đại diện"
                  title="Cập nhật ảnh đại diện"
                  className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <CameraIcon className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>

            {/* Tên, Bio & Metadata */}
            <div className="min-w-0 flex-1 space-y-2 pt-1 sm:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                  {displayName}
                </h1>

                {controller.isOwnProfile ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>Đã xác thực</span>
                  </span>
                ) : profile.friendshipStatus === 'FRIEND' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary-active">
                    <UserCheckIcon className="w-3.5 h-3.5" />
                    <span>Bạn bè</span>
                  </span>
                ) : profile.friendshipStatus === 'REQUEST_SENT' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-semibold text-info">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>Đã gửi lời mời</span>
                  </span>
                ) : profile.friendshipStatus === 'REQUEST_RECEIVED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                    <UserPlusIcon className="w-3.5 h-3.5" />
                    <span>Muốn kết bạn với bạn</span>
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-muted leading-relaxed max-w-3xl">
                {profile.bio?.trim()
                  ? profile.bio
                  : controller.isOwnProfile
                    ? 'Hãy thêm đôi dòng giới thiệu để bạn bè trên cộng đồng dễ dàng kết nối với bạn.'
                    : 'Thành viên cộng đồng Lyora.'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted">
                {profile.workplace && (
                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseIcon className="w-4 h-4 text-primary shrink-0" />
                    <span>{profile.workplace}</span>
                  </span>
                )}

                {profile.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-primary shrink-0" />
                    <span>{profile.location}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                  <span>Tham gia {formatDate(profile.createdAt)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => controller.handleSelectTab('friends')}
                  className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary hover:underline cursor-pointer tabular-nums"
                >
                  <UsersIcon className="w-4 h-4 text-primary shrink-0" />
                  <span>{profile.friendsCount} bạn bè</span>
                  {!controller.isOwnProfile && profile.mutualFriendsCount > 0 && (
                    <span className="font-normal text-muted">
                      ({profile.mutualFriendsCount} bạn chung)
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Nhóm nút hành động (tối đa 1 nút Primary nổi bật) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 lg:pt-4">
            {controller.isOwnProfile ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  onClick={controller.handleOpenEditModal}
                  className="gap-1.5"
                >
                  <EditIcon className="w-4 h-4" />
                  <span>Chỉnh sửa hồ sơ</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void controller.handleCopyProfileLink()}
                  className="gap-1.5"
                >
                  <CopyIcon className="w-4 h-4 text-muted" />
                  <span>Sao chép liên kết</span>
                </Button>
              </>
            ) : profile.friendshipStatus === 'FRIEND' ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  onClick={controller.handleOpenMessages}
                  className="gap-1.5"
                >
                  <ChatBubbleOutlineIcon className="w-4 h-4" />
                  <span>Nhắn tin</span>
                </Button>

                <div ref={controller.friendMenuRef} className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.handleToggleFriendMenu}
                    aria-expanded={controller.isFriendMenuOpen}
                    aria-haspopup="menu"
                    disabled={controller.isFriendshipMutating}
                    className="gap-1.5"
                  >
                    <UserCheckIcon className="w-4 h-4 text-primary" />
                    <span>Bạn bè</span>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-muted" />
                  </Button>

                  {controller.isFriendMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Tùy chọn kết nối bạn bè"
                      className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-card p-1.5 shadow-sm z-30"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          controller.handleRequestUnfriend(profile.id, displayName)
                        }
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer"
                      >
                        <UserMinusIcon className="w-4 h-4" />
                        <span>Hủy kết bạn</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : profile.friendshipStatus === 'REQUEST_SENT' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={controller.isFriendshipMutating}
                  onClick={() =>
                    void controller.handleCancelFriendRequest(profile.id, displayName)
                  }
                  className="gap-1.5"
                >
                  <ClockIcon className="w-4 h-4 text-info" />
                  <span>Hủy lời mời kết bạn</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={controller.handleOpenMessages}
                  className="gap-1.5"
                >
                  <ChatBubbleOutlineIcon className="w-4 h-4" />
                  <span>Nhắn tin</span>
                </Button>
              </>
            ) : profile.friendshipStatus === 'REQUEST_RECEIVED' ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  disabled={controller.isFriendshipMutating}
                  onClick={() =>
                    void controller.handleAcceptFriendRequest(profile.id, displayName)
                  }
                  className="gap-1.5"
                >
                  <UserCheckIcon className="w-4 h-4" />
                  <span>Chấp nhận kết bạn</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={controller.isFriendshipMutating}
                  onClick={() =>
                    void controller.handleRejectFriendRequest(profile.id, displayName)
                  }
                >
                  Từ chối
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  disabled={controller.isFriendshipMutating}
                  onClick={() =>
                    void controller.handleSendFriendRequest(profile.id, displayName)
                  }
                  className="gap-1.5"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Thêm bạn bè</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={controller.handleOpenMessages}
                  className="gap-1.5"
                >
                  <ChatBubbleOutlineIcon className="w-4 h-4" />
                  <span>Nhắn tin</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Thanh Tab điều hướng của Hồ sơ */}
        <nav
          aria-label="Phân mục trang cá nhân"
          className="flex items-center gap-1 overflow-x-auto pt-1"
        >
          <button
            type="button"
            onClick={() => controller.handleSelectTab('overview')}
            aria-current={controller.activeTab === 'overview' ? 'page' : undefined}
            className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              controller.activeTab === 'overview'
                ? 'text-primary'
                : 'text-muted hover:text-foreground hover:bg-background rounded-t-lg'
            }`}
          >
            <span>Tổng quan</span>
            {controller.activeTab === 'overview' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={() => controller.handleSelectTab('about')}
            aria-current={controller.activeTab === 'about' ? 'page' : undefined}
            className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              controller.activeTab === 'about'
                ? 'text-primary'
                : 'text-muted hover:text-foreground hover:bg-background rounded-t-lg'
            }`}
          >
            <span>Giới thiệu</span>
            {controller.activeTab === 'about' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={() => controller.handleSelectTab('friends')}
            aria-current={controller.activeTab === 'friends' ? 'page' : undefined}
            className={`relative shrink-0 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              controller.activeTab === 'friends'
                ? 'text-primary'
                : 'text-muted hover:text-foreground hover:bg-background rounded-t-lg'
            }`}
          >
            <span>Bạn bè</span>
            <span className="rounded-full bg-background border border-border px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">
              {profile.friendsCount}
            </span>
            {controller.activeTab === 'friends' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        </nav>
      </div>
    </section>
  );
};
