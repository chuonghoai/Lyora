import React from 'react';
import { createPortal } from 'react-dom';
import { AppImage, Button } from '@/core';
import {
  ClockIcon,
  CloseIcon,
  MapPinIcon,
  SearchIcon,
  UserCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileFriendsSectionProps {
  controller: ProfileController;
}

export const ProfileFriendsSection: React.FC<ProfileFriendsSectionProps> = ({
  controller,
}) => {
  const profile = controller.profile;
  if (!profile) return null;

  return (
    <section
      aria-label="Danh sách bạn bè và kết nối"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5"
    >
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {controller.isOwnProfile ? 'Bạn bè & Kết nối' : `Bạn bè của ${profile.fullName}`}
          </h2>
          <p className="text-xs sm:text-sm text-muted tabular-nums">
            {controller.isOwnProfile
              ? `${controller.friendsTabCounts.all} bạn bè hiện tại · Nhấn vào từng thẻ để xem hồ sơ chi tiết`
              : `${controller.friendsTabCounts.all} bạn bè · ${controller.friendsTabCounts.mutual} bạn chung`}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={controller.friendSearchQuery}
            onChange={controller.handleFriendSearchChange}
            placeholder="Tìm theo tên hoặc khu vực..."
            aria-label="Tìm kiếm bạn bè"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          />
          {controller.friendSearchQuery && (
            <button
              type="button"
              onClick={controller.handleClearFriendSearch}
              aria-label="Xóa tìm kiếm bạn bè"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground cursor-pointer"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc phân nhóm trong phạm vi Hồ sơ */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => controller.handleSelectFriendsFilter('ALL')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            controller.friendsFilter === 'ALL'
              ? 'border-primary bg-secondary text-primary-active'
              : 'border-border bg-card text-muted hover:text-foreground hover:bg-background'
          }`}
        >
          <span>Tất cả bạn bè</span>
          <span className="tabular-nums">({controller.friendsTabCounts.all})</span>
        </button>

        {controller.isOwnProfile ? (
          <>
            <button
              type="button"
              onClick={() => controller.handleSelectFriendsFilter('REQUESTS')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                controller.friendsFilter === 'REQUESTS'
                  ? 'border-primary bg-secondary text-primary-active'
                  : 'border-border bg-card text-muted hover:text-foreground hover:bg-background'
              }`}
            >
              <span>Lời mời kết bạn</span>
              <span className="tabular-nums">({controller.friendsTabCounts.requests})</span>
            </button>

            <button
              type="button"
              onClick={() => controller.handleSelectFriendsFilter('SUGGESTIONS')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                controller.friendsFilter === 'SUGGESTIONS'
                  ? 'border-primary bg-secondary text-primary-active'
                  : 'border-border bg-card text-muted hover:text-foreground hover:bg-background'
              }`}
            >
              <span>Gợi ý kết nối</span>
              <span className="tabular-nums">({controller.friendsTabCounts.suggestions})</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => controller.handleSelectFriendsFilter('MUTUAL')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              controller.friendsFilter === 'MUTUAL'
                ? 'border-primary bg-secondary text-primary-active'
                : 'border-border bg-card text-muted hover:text-foreground hover:bg-background'
            }`}
          >
            <span>Bạn chung</span>
            <span className="tabular-nums">({controller.friendsTabCounts.mutual})</span>
          </button>
        )}
      </div>

      {/* Lưới thẻ bạn bè */}
      {controller.filteredFriendsList.length === 0 ? (
        <div className="rounded-xl border border-border bg-background/50 p-8 text-center space-y-2">
          <UsersIcon className="w-7 h-7 text-muted mx-auto" />
          <p className="text-sm font-semibold text-foreground">
            {controller.friendSearchQuery
              ? `Không tìm thấy kết quả khớp với "${controller.friendSearchQuery}"`
              : controller.friendsFilter === 'REQUESTS'
                ? 'Hiện không có lời mời kết bạn nào'
                : controller.friendsFilter === 'SUGGESTIONS'
                  ? 'Bạn đã kết nối hết với các gợi ý hiện có'
                  : 'Chưa có danh sách bạn bè phù hợp'}
          </p>
          {controller.friendSearchQuery && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={controller.handleClearFriendSearch}
                className="h-8 px-3 py-1 text-xs"
              >
                Xóa bộ lọc tìm kiếm
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {controller.filteredFriendsList.map((friend) => {
            const initial = friend.fullName.charAt(0).toUpperCase();
            const isSelfCard = controller.currentUser?.id === friend.id;

            return (
              <div
                key={friend.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3.5 hover:border-secondary-strong transition-colors"
              >
                <button
                  type="button"
                  onClick={() => controller.handleOpenUserProfile(friend.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                >
                  <span className="relative shrink-0">
                    {friend.avatarUrl ? (
                      <AppImage
                        src={friend.avatarUrl}
                        alt={friend.fullName}
                        rounded
                        className="h-14 w-14 border border-border"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-base font-bold text-primary-active border border-border">
                        {initial}
                      </span>
                    )}
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate">
                      {friend.fullName}
                    </p>
                    {friend.headline && (
                      <p className="text-xs text-muted truncate">{friend.headline}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted tabular-nums">
                      {friend.mutualFriendsCount > 0 && (
                        <span>{friend.mutualFriendsCount} bạn chung</span>
                      )}
                      {friend.location && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{friend.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Hành động tương ứng với trạng thái quan hệ */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelfCard ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => controller.handleOpenUserProfile('me')}
                      className="h-8 px-3 py-1 text-xs"
                    >
                      Hồ sơ của bạn
                    </Button>
                  ) : friend.friendshipStatus === 'FRIEND' ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => controller.handleOpenUserProfile(friend.id)}
                        className="h-8 px-3 py-1 text-xs"
                      >
                        Xem hồ sơ
                      </Button>
                      <button
                        type="button"
                        disabled={controller.isFriendshipMutating}
                        onClick={() =>
                          controller.handleRequestUnfriend(friend.id, friend.fullName)
                        }
                        title={`Hủy kết bạn với ${friend.fullName}`}
                        aria-label={`Hủy kết bạn với ${friend.fullName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-error hover:border-error/40 hover:bg-error/10 transition-colors cursor-pointer"
                      >
                        <UserMinusIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : friend.friendshipStatus === 'REQUEST_RECEIVED' ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={controller.isFriendshipMutating}
                        onClick={() =>
                          void controller.handleAcceptFriendRequest(friend.id, friend.fullName)
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
                          void controller.handleRejectFriendRequest(friend.id, friend.fullName)
                        }
                        className="h-8 px-2.5 py-1 text-xs"
                      >
                        Từ chối
                      </Button>
                    </>
                  ) : friend.friendshipStatus === 'REQUEST_SENT' ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={controller.isFriendshipMutating}
                      onClick={() =>
                        void controller.handleCancelFriendRequest(friend.id, friend.fullName)
                      }
                      className="h-8 px-3 py-1 text-xs gap-1"
                    >
                      <ClockIcon className="w-3.5 h-3.5 text-info" />
                      <span>Hủy lời mời</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={controller.isFriendshipMutating}
                      onClick={() =>
                        void controller.handleSendFriendRequest(friend.id, friend.fullName)
                      }
                      className="h-8 px-3 py-1 text-xs gap-1"
                    >
                      <UserPlusIcon className="w-3.5 h-3.5" />
                      <span>Thêm bạn bè</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal xác nhận hủy kết bạn */}
      {controller.unfriendTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận hủy kết bạn"
            onClick={controller.handleCancelUnfriend}
            className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Hủy kết bạn với {controller.unfriendTarget.fullName}?
                  </h3>
                  <p className="mt-1 text-sm text-muted leading-relaxed">
                    Bạn có chắc chắn muốn xóa{' '}
                    <strong className="text-foreground">{controller.unfriendTarget.fullName}</strong>{' '}
                    khỏi danh sách bạn bè? Bạn vẫn có thể gửi lại lời mời kết bạn sau này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={controller.handleCancelUnfriend}
                  aria-label="Đóng hộp thoại xác nhận"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={controller.handleCancelUnfriend}
                  disabled={controller.isUnfriending}
                >
                  Giữ kết nối
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  isLoading={controller.isUnfriending}
                  onClick={() => void controller.handleConfirmUnfriend()}
                >
                  Xác nhận hủy kết bạn
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};
