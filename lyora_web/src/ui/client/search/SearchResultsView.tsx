import React from 'react';
import { Link } from 'react-router-dom';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDateTime,
  formatRelativeTime,
  LoadingState,
} from '@/core';
import { getClientPostDetailPath, getClientProfilePath } from '@/routes/paths';
import { SearchIcon, UsersIcon } from '../home/ClientIcons';
import { useSearchController, type SearchResultTab } from './search.controller';

const tabs: Array<{ id: SearchResultTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'people', label: 'Mọi người' },
  { id: 'posts', label: 'Bài viết' },
];

export default function SearchResultsView(): React.ReactElement {
  const controller = useSearchController();
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
                <Link
                  key={person.id}
                  to={getClientProfilePath(person.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 hover:bg-background transition-colors"
                >
                  {person.avatarUrl ? (
                    <AppImage
                      src={person.avatarUrl}
                      alt={person.fullName}
                      rounded
                      className="h-11 w-11 shrink-0 border border-border"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary-active">
                      {person.fullName.charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {person.fullName}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {person.workplace || person.location || 'Thành viên Lyora'}
                    </span>
                  </span>
                </Link>
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
                <article
                  key={post.id}
                  className="rounded-xl border border-border bg-background/40 p-4 space-y-3"
                >
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
                    <p className="text-xs font-medium text-muted">
                      Đính kèm {post.media.length} tệp phương tiện
                    </p>
                  )}
                </article>
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
    </div>
  );
}
