import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDateTime,
  formatRelativeTime,
  LoadingSpinner,
  LoadingState,
} from '@/core';
import type { FriendDiscoveryItem } from '@/features/friends';
import type { Post, PostMediaItem } from '@/features/posts';
import { getClientPostDetailPath, getClientProfilePath } from '@/routes/paths';
import {
  CheckIcon,
  ClockIcon,
  SearchIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from '../home/ClientIcons';
import { MediaLightboxModal } from '../home/MediaLightboxModal';
import { PostMediaGallery } from '../home/PostCard';
import {
  useSearchController,
  type SearchController,
  type SearchResultTab,
} from './search.controller';

const tabs: Array<{ id: SearchResultTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'people', label: 'Mọi người' },
  { id: 'posts', label: 'Bài viết' },
  { id: 'pages', label: 'Trang' },
];

function PersonResultCard({
  person,
  controller,
}: {
  person: FriendDiscoveryItem;
  controller: SearchController;
}): React.ReactElement {
  const isIncoming = person.friendshipStatus === 'REQUEST_RECEIVED';
  const pending = controller.isActionPending(person.id);

  return (
    <article className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
      <Link
        to={getClientProfilePath(person.id)}
        className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-bold text-primary-active">
          {person.avatarUrl ? (
            <AppImage
              src={person.avatarUrl}
              alt={person.fullName}
              rounded
              className="h-11 w-11"
            />
          ) : (
            person.fullName.charAt(0)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {person.fullName}
          </span>
          <span className="block truncate text-xs text-muted">
            {person.mutualFriendsCount > 0
              ? `${person.mutualFriendsCount} bạn chung`
              : person.workplace || person.location || 'Gợi ý cho bạn'}
          </span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        {pending ? (
          <span className="inline-flex h-8 min-w-24 items-center justify-center rounded-lg bg-secondary px-2.5 text-primary-active">
            <LoadingSpinner size="sm" />
          </span>
        ) : (
          <>
            {person.friendshipStatus === 'NONE' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void controller.handleSendRequest(person.id, person.fullName)}
                className="h-8 gap-1 px-2.5 py-1 text-xs"
              >
                <UserPlusIcon className="h-3.5 w-3.5" />
                Thêm bạn
              </Button>
            )}
            {person.friendshipStatus === 'REQUEST_SENT' && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void controller.handleRemoveRequest(person.id, person.fullName, false)
                }
                className="h-8 gap-1 px-2.5 py-1 text-xs"
                title="Hủy lời mời kết bạn"
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
                  onClick={() =>
                    void controller.handleAcceptRequest(person.id, person.fullName)
                  }
                  className="h-8 gap-1 px-2.5 py-1 text-xs"
                >
                  <UserCheckIcon className="h-3.5 w-3.5" />
                  Chấp nhận
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void controller.handleRemoveRequest(person.id, person.fullName, true)
                  }
                  className="h-8 px-2.5 py-1 text-xs"
                >
                  Từ chối
                </Button>
              </>
            )}
            {person.friendshipStatus === 'FRIEND' && (
              <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary px-2.5 text-xs font-semibold text-primary-active">
                <CheckIcon className="h-3.5 w-3.5" />
                Bạn bè
              </span>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function PostResultCard({
  post,
  onOpenLightbox,
}: {
  post: Post;
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}): React.ReactElement {
  return (
    <article className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {post.author.avatarUrl ? (
            <AppImage
              src={post.author.avatarUrl}
              alt={post.author.fullName}
              rounded
              className="h-8 w-8 shrink-0 border border-border"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">
              {post.author.fullName.charAt(0)}
            </span>
          )}
          <Link
            to={getClientProfilePath(post.author.id)}
            className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
          >
            {post.author.fullName}
          </Link>
        </div>

        {post.createdAt && (
          <Link
            to={getClientPostDetailPath(post.id)}
            title={formatDateTime(post.createdAt)}
            className="text-xs text-muted hover:text-primary hover:underline shrink-0"
          >
            {formatRelativeTime(post.createdAt)}
          </Link>
        )}
      </div>

      {post.content && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {post.content}
        </p>
      )}

      {post.media.length > 0 && (
        <div>
          <PostMediaGallery media={post.media} onOpenLightbox={onOpenLightbox} />
        </div>
      )}
    </article>
  );
}

export default function SearchResultsView(): React.ReactElement {
  const controller = useSearchController();
  const [lightbox, setLightbox] = useState<{
    items: PostMediaItem[];
    index: number;
  } | null>(null);

  const showPeople = controller.activeTab === 'all' || controller.activeTab === 'people';
  const showPosts = controller.activeTab === 'all' || controller.activeTab === 'posts';

  if (controller.query.length < 2) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Nhập từ khóa để tìm kiếm"
          description="Vui lòng nhập ít nhất 2 ký tự vào ô tìm kiếm phía trên để tìm mọi người và bài viết trên Lyora."
          action={{
            label: 'Quay lại bảng tin',
            onClick: controller.handleBackToFeed,
            variant: 'outline',
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm text-muted">Kết quả tìm kiếm cho</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{controller.query}</h1>
        <nav aria-label="Loại kết quả" className="mt-5 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => controller.handleSelectTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer ${
                controller.activeTab === tab.id
                  ? 'bg-secondary text-primary'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {controller.activeTab === 'pages' ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <UsersIcon className="mx-auto h-7 w-7 text-muted" />
          <h2 className="mt-3 font-semibold text-foreground">Trang sẽ sớm có mặt</h2>
          <p className="mt-1 text-sm text-muted">
            Lyora chưa có hệ thống Trang và Theo dõi trang để tìm kiếm.
          </p>
        </section>
      ) : (
        <>
          {showPeople && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Mọi người</h2>
              {controller.isLoadingPeople ? (
                <LoadingState
                  variant="skeleton-list"
                  count={2}
                  label="Đang tìm kiếm mọi người..."
                />
              ) : controller.isPeopleError ? (
                <ErrorState
                  compact
                  title="Không thể tìm kiếm thành viên"
                  description="Kết nối đến máy chủ bị gián đoạn. Vui lòng thử lại."
                  onRetry={controller.handleRetryPeople}
                />
              ) : controller.people.length === 0 ? (
                <EmptyState
                  compact
                  icon={<UsersIcon className="h-5 w-5" />}
                  title="Không tìm thấy người dùng phù hợp"
                  description={`Không có thành viên nào khớp với từ khóa "${controller.query}".`}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {controller.people.map((person) => (
                    <PersonResultCard
                      key={person.id}
                      person={person}
                      controller={controller}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {showPosts && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Bài viết</h2>
              {controller.isLoadingPosts ? (
                <LoadingState
                  variant="skeleton-cards"
                  count={2}
                  label="Đang tìm kiếm bài viết..."
                />
              ) : controller.isPostsError ? (
                <ErrorState
                  compact
                  title="Không thể tìm kiếm bài viết"
                  description="Kết nối đến máy chủ bị gián đoạn. Vui lòng thử lại."
                  onRetry={controller.handleRetryPosts}
                />
              ) : controller.posts.length === 0 ? (
                <EmptyState
                  compact
                  icon={<SearchIcon className="h-5 w-5" />}
                  title="Không tìm thấy bài viết phù hợp"
                  description={`Không có bài viết nào chứa nội dung "${controller.query}".`}
                  action={{
                    label: 'Quay lại bảng tin',
                    onClick: controller.handleBackToFeed,
                    variant: 'outline',
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {controller.posts.map((post) => (
                    <PostResultCard
                      key={post.id}
                      post={post}
                      onOpenLightbox={(items, index) => setLightbox({ items, index })}
                    />
                  ))}

                  {controller.hasNextPostsPage && (
                    <div className="pt-2 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        isLoading={controller.isFetchingNextPosts}
                        onClick={controller.handleLoadMorePosts}
                      >
                        Tải thêm bài viết
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <MediaLightboxModal
        controller={{
          lightbox,
          handleCloseLightbox: () => setLightbox(null),
          handlePrevLightbox: () =>
            setLightbox((current) =>
              current
                ? {
                    ...current,
                    index: (current.index - 1 + current.items.length) % current.items.length,
                  }
                : null,
            ),
          handleNextLightbox: () =>
            setLightbox((current) =>
              current
                ? { ...current, index: (current.index + 1) % current.items.length }
                : null,
            ),
        }}
      />
    </div>
  );
}
