import React from "react";
import { AppImage, Button, LoadingSpinner } from "@/core";
import type { FriendDiscoveryItem } from "@/features/friends";
import {
  CheckIcon,
  ClockIcon,
  SearchIcon,
  UserCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "../home/ClientIcons";
import {
  useFriendsController,
  type FriendsController,
} from "./friends.controller";

interface FriendCardProps {
  friend: FriendDiscoveryItem;
  controller: FriendsController;
  requestActions?: boolean;
  showSuggestionMeta?: boolean;
}

const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  controller,
  requestActions = false,
  showSuggestionMeta = false,
}) => {
  const initial = friend.fullName.charAt(0).toUpperCase();
  const isIncoming = friend.friendshipStatus === "REQUEST_RECEIVED";
  return (
    <article className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <button
        type="button"
        onClick={() => controller.handleOpenProfile(friend.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer group"
      >
        {friend.avatarUrl ? (
          <AppImage
            src={friend.avatarUrl}
            alt={friend.fullName}
            rounded
            className="h-12 w-12 border border-border"
          />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-secondary text-sm font-bold text-primary-active">
            {initial}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {friend.fullName}
          </span>
          <span className="block truncate text-xs text-muted">
            {showSuggestionMeta && friend.mutualFriendsCount > 0
              ? `${friend.mutualFriendsCount} bạn chung`
              : showSuggestionMeta
                ? "Gợi ý cho bạn"
                : friend.workplace ||
                  friend.location ||
                  "Thành viên cộng đồng Lyora"}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {friend.friendshipStatus === "NONE" && (
          <Button
            type="button"
            variant="secondary"
            disabled={controller.isMutating}
            onClick={() =>
              void controller.handleSendRequest(friend.id, friend.fullName)
            }
            className="h-8 px-2.5 py-1 text-xs gap-1"
          >
            <UserPlusIcon className="h-3.5 w-3.5" />
            Thêm bạn
          </Button>
        )}
        {friend.friendshipStatus === "REQUEST_SENT" && (
          <Button
            type="button"
            variant="outline"
            disabled={controller.isMutating}
            onClick={() =>
              void controller.handleRemoveRequest(
                friend.id,
                friend.fullName,
                false,
              )
            }
            className="h-8 px-2.5 py-1 text-xs gap-1"
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Đã gửi
          </Button>
        )}
        {isIncoming && (
          <>
            <Button
              type="button"
              variant="primary"
              disabled={controller.isMutating}
              onClick={() =>
                void controller.handleAcceptRequest(friend.id, friend.fullName)
              }
              className="h-8 px-2.5 py-1 text-xs gap-1"
            >
              <UserCheckIcon className="h-3.5 w-3.5" />
              Chấp nhận
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={controller.isMutating}
              onClick={() =>
                void controller.handleRemoveRequest(
                  friend.id,
                  friend.fullName,
                  true,
                )
              }
              className="h-8 px-2.5 py-1 text-xs"
            >
              {requestActions ? "Từ chối" : "Bỏ qua"}
            </Button>
          </>
        )}
        {friend.friendshipStatus === "FRIEND" && (
          <button
            type="button"
            disabled={controller.isMutating}
            aria-label={`Hủy kết bạn với ${friend.fullName}`}
            title={`Hủy kết bạn với ${friend.fullName}`}
            onClick={() =>
              void controller.handleUnfriend(friend.id, friend.fullName)
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:border-error/40 hover:bg-error/10 hover:text-error disabled:opacity-50 cursor-pointer"
          >
            <UserMinusIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
};

export default function FriendsView(): React.ReactElement {
  const controller = useFriendsController();
  const hasSearch = controller.searchText.trim().length >= 2;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bạn bè
          </h1>
          <p className="text-sm text-muted">
            Tìm thành viên Lyora và quản lý những kết nối đang chờ của bạn.
          </p>
        </div>
        <label className="relative mt-5 block max-w-2xl">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={controller.searchText}
            onChange={controller.handleSearchChange}
            placeholder="Tìm theo tên thành viên..."
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {controller.searchText && (
            <button
              type="button"
              onClick={controller.handleClearSearch}
              aria-label="Xóa nội dung tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted hover:text-foreground cursor-pointer"
            >
              ×
            </button>
          )}
        </label>
        <p className="mt-2 text-xs text-muted">
          Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm.
        </p>
      </section>

      {controller.receivedRequests.length > 0 && (
        <section
          aria-labelledby="friend-requests-heading"
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <h2
              id="friend-requests-heading"
              className="text-base font-semibold text-foreground"
            >
              Lời mời kết bạn
            </h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-active">
              {controller.receivedRequests.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {controller.receivedRequests.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                controller={controller}
                requestActions
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="accepted-friends-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <h2
            id="accepted-friends-heading"
            className="text-base font-semibold text-foreground"
          >
            Bạn bè của bạn
          </h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-active">
            {controller.acceptedFriends.length}
          </span>
        </div>
        {controller.acceptedFriends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
            <UsersIcon className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Bạn chưa có bạn bè. Hãy tìm thành viên để kết nối.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {controller.acceptedFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                controller={controller}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="friend-search-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="friend-search-heading"
            className="text-base font-semibold text-foreground"
          >
            Khám phá thành viên
          </h2>
          {hasSearch && !controller.isSearching && (
            <span className="text-xs text-muted tabular-nums">
              {controller.totalResults} kết quả
            </span>
          )}
        </div>
        {!hasSearch ? controller.isLoadingSuggestions ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-border bg-card">
            <LoadingSpinner size="md" />
          </div>
        ) : controller.suggestionsError ? (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"
          >
            Không thể tải gợi ý thành viên lúc này. Vui lòng thử lại.
          </div>
        ) : controller.suggestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 p-8 text-center">
            <UsersIcon className="mx-auto h-7 w-7 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Chưa có gợi ý thành viên mới vào lúc này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {controller.suggestions.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                controller={controller}
                showSuggestionMeta
              />
            ))}
          </div>
        ) : controller.isSearching ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-border bg-card">
            <LoadingSpinner size="md" />
          </div>
        ) : controller.searchError ? (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"
          >
            Không thể tìm kiếm thành viên lúc này. Vui lòng thử lại.
          </div>
        ) : controller.results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 p-8 text-center">
            <CheckIcon className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Không tìm thấy thành viên phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {controller.results.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                controller={controller}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
