import React from 'react';
import {
  AppImage,
  Button,
  ConfirmModal,
  EmptyState,
  ErrorState,
  formatDate,
  formatDateTime,
  LoadingSpinner,
  LoadingState,
} from '@/core';
import { getTopReactions } from '@/features/posts';
import {
  AcademicCapIcon,
  AdminReactionIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarIcon,
  CommentIcon,
  FlagIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  ShareIcon,
  UnlockIcon,
  UsersIcon,
} from '../components/AdminIcons';
import { AdminPostCommentsSection } from './AdminPostCommentsSection';
import { AdminPostReactionsModal } from './AdminPostReactionsModal';
import { AdminPostSharesModal } from './AdminPostSharesModal';
import { AdminUserPostActionMenu } from './AdminUserPostActionMenu';
import { AdminUserPostModerationModal } from './AdminUserPostModerationModal';
import {
  useAdminUserDetailController,
  type AdminUserPostVisibilityFilter,
} from './admin-user-detail.controller';
import { LockUserModal } from './LockUserModal';

const VISIBILITY_LABELS: Record<'PUBLIC' | 'FRIENDS' | 'PRIVATE', string> = {
  PUBLIC: 'Công khai',
  FRIENDS: 'Bạn bè',
  PRIVATE: 'Riêng tư',
};

const VISIBILITY_FILTER_OPTIONS: Array<{
  value: AdminUserPostVisibilityFilter;
  label: string;
}> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PUBLIC', label: 'Công khai' },
    { value: 'FRIENDS', label: 'Bạn bè' },
    { value: 'PRIVATE', label: 'Riêng tư' },
  ];

export const AdminUserDetailView: React.FC = () => {
  const ctrl = useAdminUserDetailController();

  if (ctrl.isLoadingUser) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-56 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="h-44 sm:h-52 bg-secondary/50 animate-pulse" />
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-6 w-60 rounded-lg bg-secondary/50" />
            <div className="h-4 w-72 rounded-lg bg-border/70" />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 h-72 rounded-xl border border-border bg-card animate-pulse" />
          <div className="xl:col-span-8 h-72 rounded-xl border border-border bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (ctrl.isUserError || !ctrl.user) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          title="Không tìm thấy hồ sơ người dùng"
          description="Tài khoản không tồn tại hoặc kết nối máy chủ bị gián đoạn."
          onRetry={ctrl.handleRefreshAll}
          secondaryAction={{
            label: 'Quay lại danh sách',
            onClick: ctrl.handleBackToList,
          }}
        />
      </div>
    );
  }

  const user = ctrl.user;
  const displayName = user.fullName?.trim() || 'Thành viên Lyora';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={ctrl.handleBackToList}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Danh sách người dùng</span>
          </button>

          <span className="text-xs sm:text-sm text-muted truncate">
            Hồ sơ kiểm duyệt · <strong className="text-foreground">{displayName}</strong>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={ctrl.handleRefreshAll}
          className="h-8 px-3 py-1 text-xs gap-1.5 border-border bg-card"
        >
          <RefreshIcon className="w-3.5 h-3.5 text-muted" />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Admin View Profile Header */}
      <section
        aria-label="Tổng quan hồ sơ người dùng"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Cover banner + Flag Cover Action */}
        <div className="relative h-40 sm:h-52 w-full bg-secondary border-b border-border overflow-hidden">
          {user.coverUrl && (
            <AppImage
              src={user.coverUrl}
              alt={`Ảnh bìa của ${displayName}`}
              className="h-full w-full rounded-none object-cover"
            />
          )}

          <button
            type="button"
            onClick={ctrl.handleFlagCoverViolation}
            className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-background hover:text-warning transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <FlagIcon className="w-3.5 h-3.5 text-warning" />
            <span>Đánh dấu vi phạm ảnh bìa</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              {/* Avatar + Online status + Flag Avatar Action */}
              <div className="flex flex-col items-start sm:items-center gap-2 shrink-0 -mt-14 sm:-mt-16">
                <div className="relative">
                  {user.avatarUrl ? (
                    <AppImage
                      src={user.avatarUrl}
                      alt={displayName}
                      rounded
                      className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-card shadow-sm"
                    />
                  ) : (
                    <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-card bg-secondary text-2xl font-bold text-primary shadow-sm">
                      {initial}
                    </div>
                  )}
                  <span
                    title={user.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                    className={[
                      'absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full ring-2 ring-card',
                      user.isOnline ? 'bg-success' : 'bg-muted/60',
                    ].join(' ')}
                  />
                </div>

                <button
                  type="button"
                  onClick={ctrl.handleFlagAvatarViolation}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:text-warning hover:border-warning/40 transition-colors cursor-pointer"
                >
                  <FlagIcon className="w-3 h-3 text-warning" />
                  <span>Vi phạm ảnh đại diện</span>
                </button>
              </div>

              <div className="min-w-0 space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {displayName}
                  </h1>
                  <span
                    className={[
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
                      user.role === 'ADMIN'
                        ? 'border-secondary-strong bg-secondary text-primary'
                        : 'border-border bg-background text-foreground',
                    ].join(' ')}
                  >
                    {user.role === 'ADMIN' ? 'Quản trị' : 'Người dùng'}
                  </span>
                </div>

                <p className="text-sm text-muted truncate">{user.email}</p>

                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <span
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      user.isOnline
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-border bg-background text-muted',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        'h-1.5 w-1.5 rounded-full',
                        user.isOnline ? 'bg-success' : 'bg-muted/60',
                      ].join(' ')}
                    />
                    {user.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                  </span>

                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                      <LockIcon className="w-3 h-3" />
                      Đã bị khóa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Moderation Action Zone */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {ctrl.canLockTarget && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={ctrl.handleOpenLockModal}
                  className="gap-1.5"
                >
                  <LockIcon className="w-4 h-4" />
                  <span>Khóa tài khoản</span>
                </Button>
              )}

              {ctrl.canUnlockTarget && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={ctrl.handleOpenUnlockConfirm}
                  className="gap-1.5 border-success/40 text-success hover:bg-success/10"
                >
                  <UnlockIcon className="w-4 h-4" />
                  <span>Mở khóa tài khoản</span>
                </Button>
              )}

              {!ctrl.canLockTarget && !ctrl.canUnlockTarget && (
                <span className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted">
                  {ctrl.isSelfAccount
                    ? 'Tài khoản quản trị hiện tại của bạn'
                    : 'Không thể khóa tài khoản quản trị viên'}
                </span>
              )}
            </div>
          </div>

          {/* Lock Reason Banner when Account is Locked */}
          {!user.isActive && (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error/10 p-4 space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-error">
                  Tài khoản đang bị khóa
                </p>
                {user.lockedAt && (
                  <span className="text-xs text-muted tabular-nums">
                    Thời điểm khóa: {formatDateTime(user.lockedAt)}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
                {user.lockReason?.trim() || 'Không có ghi chú lý do cụ thể.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Account Details */}
        <aside className="xl:col-span-4 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground">
              Thông tin tài khoản
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Dữ liệu hồ sơ và liên hệ hiển thị theo quyền quản trị
            </p>
          </div>

          {user.bio && (
            <p className="text-sm text-foreground leading-relaxed rounded-lg border border-border bg-background/50 p-3">
              {user.bio}
            </p>
          )}

          <dl className="divide-y divide-border text-sm">
            <div className="py-2.5 flex items-start gap-2.5">
              <MailIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Email</dt>
                <dd className="text-foreground break-all">{user.email}</dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <PhoneIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Số điện thoại</dt>
                <dd className="text-foreground">{user.phoneNumber || 'Chưa cập nhật'}</dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <MapPinIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Nơi sống / Quê quán</dt>
                <dd className="text-foreground">
                  {[user.location, user.hometown].filter(Boolean).join(' · ') ||
                    'Chưa cập nhật'}
                </dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <BriefcaseIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Nơi làm việc</dt>
                <dd className="text-foreground">{user.workplace || 'Chưa cập nhật'}</dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <AcademicCapIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Học vấn</dt>
                <dd className="text-foreground">{user.education || 'Chưa cập nhật'}</dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <LinkIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Trang web</dt>
                <dd className="text-foreground break-all">
                  {user.website || 'Chưa cập nhật'}
                </dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <UsersIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Bạn bè</dt>
                <dd className="text-foreground tabular-nums">
                  {user.friendsCount.toLocaleString('vi-VN')} kết nối
                </dd>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-2.5">
              <CalendarIcon className="w-4 h-4 text-muted mt-0.5" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted">Ngày tạo tài khoản</dt>
                <dd className="text-foreground tabular-nums">
                  {user.createdAt ? formatDate(user.createdAt) : 'Chưa rõ'}
                </dd>
              </div>
            </div>
          </dl>
        </aside>

        {/* Right Column: User Posts & Moderation Actions */}
        <section
          aria-label="Bài viết của người dùng"
          className="xl:col-span-8 space-y-4"
        >
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Bài viết cộng đồng ({ctrl.totalPosts.toLocaleString('vi-VN')})
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Rà soát nội dung và thực hiện thao tác kiểm duyệt trên bài viết của thành viên
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
              {VISIBILITY_FILTER_OPTIONS.map((opt) => {
                const active = ctrl.visibilityFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => ctrl.setVisibilityFilter(opt.value)}
                    className={[
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                      active
                        ? 'bg-card text-primary border border-border'
                        : 'text-foreground/75 hover:text-foreground',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {ctrl.isLoadingPosts ? (
            <LoadingState
              variant="skeleton-cards"
              count={3}
              label="Đang tải bài viết của người dùng..."
            />
          ) : ctrl.isPostsError ? (
            <ErrorState
              title="Không thể tải danh sách bài viết"
              description="Kết nối máy chủ gặp sự cố khi tải bài viết của người dùng."
              onRetry={ctrl.handleRetryPosts}
            />
          ) : ctrl.posts.length === 0 ? (
            <EmptyState
              title={
                ctrl.visibilityFilter !== 'ALL'
                  ? 'Không có bài viết nào ở chế độ hiển thị này'
                  : 'Người dùng này chưa đăng bài viết nào'
              }
              description={
                ctrl.visibilityFilter !== 'ALL'
                  ? 'Hãy chuyển về Tất cả để xem các bài viết khác của thành viên.'
                  : 'Các bài viết mới của thành viên sẽ xuất hiện tại đây để quản trị viên theo dõi.'
              }
              action={
                ctrl.visibilityFilter !== 'ALL'
                  ? {
                    label: 'Xem tất cả bài viết',
                    onClick: () => ctrl.setVisibilityFilter('ALL'),
                    variant: 'outline',
                  }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {ctrl.posts.map((post) => {
                const authorName = post.author.fullName?.trim() || displayName;
                const authorAvatar = post.author.avatarUrl ?? user.avatarUrl;
                const authorInitial = authorName.charAt(0).toUpperCase();
                const topReactions = getTopReactions(post.reactionBreakdown, 3);
                const isCommentsExpanded = Boolean(ctrl.expandedCommentsMap[post.id]);

                return (
                  <article
                    key={post.id}
                    className="rounded-xl border border-border bg-card"
                  >
                    <div className="p-5 space-y-4">
                      <header className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {authorAvatar ? (
                            <AppImage
                              src={authorAvatar}
                              alt={authorName}
                              rounded
                              className="h-10 w-10 shrink-0 border border-border"
                            />
                          ) : (
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary">
                              {authorInitial}
                            </span>
                          )}

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {authorName}
                              </span>
                              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted">
                                {VISIBILITY_LABELS[post.visibility] ?? post.visibility}
                              </span>
                            </div>
                            <p className="text-xs text-muted tabular-nums">
                              Đăng lúc {formatDateTime(post.createdAt)}
                            </p>
                          </div>
                        </div>

                        <AdminUserPostActionMenu
                          postId={post.id}
                          disabled={ctrl.isModeratingPost}
                          onHidePost={() => ctrl.handleOpenHidePostModal(post)}
                          onFlagViolation={ctrl.handleFlagPostViolation}
                          onRemovePost={() => ctrl.handleOpenRemovePostModal(post)}
                        />
                      </header>

                      {post.content && (
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                          {post.content}
                        </p>
                      )}

                      {post.media.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {post.media.map((media, idx) =>
                            media.type === 'IMAGE' ? (
                              <AppImage
                                key={`${post.id}-media-${idx}`}
                                src={media.url}
                                alt={media.fileName || 'Hình ảnh bài viết'}
                                className="h-52 w-full rounded-xl border border-border object-cover"
                              />
                            ) : media.type === 'VIDEO' ? (
                              <video
                                key={`${post.id}-media-${idx}`}
                                src={media.url}
                                controls
                                className="h-52 w-full rounded-xl border border-border bg-background object-cover"
                              />
                            ) : (
                              <audio
                                key={`${post.id}-media-${idx}`}
                                src={media.url}
                                controls
                                className="w-full"
                              />
                            ),
                          )}
                        </div>
                      )}

                      <footer className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted tabular-nums">
                        <div className="flex items-center gap-1.5 min-h-5">
                          {post.reactionCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => ctrl.handleOpenReactionsModal(post.id)}
                              className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                              <span className="inline-flex items-center -space-x-1">
                                {topReactions.map((item) => (
                                  <span
                                    key={item.type}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-card"
                                  >
                                    <AdminReactionIcon type={item.type} className="w-4 h-4" />
                                  </span>
                                ))}
                              </span>
                              <span className="font-medium hover:underline">
                                {post.reactionCount.toLocaleString('vi-VN')} cảm xúc
                              </span>
                            </button>
                          ) : (
                            <span>0 cảm xúc</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            onClick={() => ctrl.handleTogglePostComments(post.id)}
                            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline cursor-pointer"
                          >
                            <CommentIcon className="w-3.5 h-3.5" />
                            <span>{post.commentCount.toLocaleString('vi-VN')} bình luận</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => ctrl.handleOpenSharesModal(post.id)}
                            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline cursor-pointer"
                          >
                            <ShareIcon className="w-3.5 h-3.5" />
                            <span>{post.shareCount.toLocaleString('vi-VN')} chia sẻ</span>
                          </button>
                        </div>
                      </footer>
                    </div>

                    <AdminPostCommentsSection
                      postId={post.id}
                      comments={post.comments}
                      totalCount={post.commentCount}
                      isExpanded={isCommentsExpanded}
                      onToggleExpand={ctrl.handleTogglePostComments}
                      onInspectAuthor={ctrl.handleInspectUserProfile}
                      onRequestRemoveComment={ctrl.handleOpenRemoveCommentModal}
                    />
                  </article>
                );
              })}

              <div className="py-2 text-center">
                {ctrl.isFetchingNextPosts ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted">
                    <LoadingSpinner size="sm" />
                    <span>Đang tải thêm bài viết...</span>
                  </div>
                ) : ctrl.isFetchNextPostsError ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ctrl.handleLoadMorePosts}
                    className="text-xs"
                  >
                    Thử tải thêm lại
                  </Button>
                ) : ctrl.hasNextPostsPage ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ctrl.handleLoadMorePosts}
                    className="text-xs"
                  >
                    Tải thêm bài viết
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Lock User Modal */}
      <LockUserModal
        isOpen={ctrl.isLockModalOpen}
        user={user}
        isSubmitting={ctrl.isLockingUser}
        onClose={ctrl.handleCloseLockModal}
        onConfirmLock={ctrl.handleConfirmLock}
      />

      {/* Unlock User Confirm Modal */}
      <ConfirmModal
        isOpen={ctrl.isUnlockConfirmOpen}
        title={`Mở khóa tài khoản ${displayName}?`}
        description="Sau khi mở khóa, người dùng sẽ có thể đăng nhập lại bình thường vào hệ thống Lyora và lý do khóa trước đó sẽ được xóa."
        confirmLabel="Xác nhận mở khóa"
        cancelLabel="Hủy"
        variant="primary"
        isLoading={ctrl.isUnlockingUser}
        onConfirm={() => void ctrl.handleConfirmUnlock()}
        onCancel={ctrl.handleCloseUnlockConfirm}
      />

      {/* Post Reactions Modal */}
      <AdminPostReactionsModal
        post={ctrl.reactionsModalPost}
        modalState={ctrl.reactionsModal}
        data={ctrl.reactionsData}
        isLoading={ctrl.isReactionsLoading}
        isError={ctrl.isReactionsError}
        onClose={ctrl.handleCloseReactionsModal}
        onChangeFilter={ctrl.handleChangeReactionsFilter}
        onChangePage={ctrl.handleChangeReactionsPage}
        onRetry={ctrl.handleRetryReactions}
        onInspectUser={ctrl.handleInspectUserProfile}
      />

      {/* Post Shares Modal */}
      <AdminPostSharesModal
        post={ctrl.sharesModalPost}
        isOpen={Boolean(ctrl.sharesModal)}
        data={ctrl.sharesData}
        isLoading={ctrl.isSharesLoading}
        isError={ctrl.isSharesError}
        onClose={ctrl.handleCloseSharesModal}
        onChangePage={ctrl.handleChangeSharesPage}
        onRetry={ctrl.handleRetryShares}
        onInspectUser={ctrl.handleInspectUserProfile}
      />

      {/* Post & Comment Moderation Modal */}
      <AdminUserPostModerationModal
        target={ctrl.moderationTarget}
        fallbackAuthorName={displayName}
        reason={ctrl.moderationReason}
        error={ctrl.moderationError}
        isSubmitting={ctrl.isModeratingPost}
        onReasonChange={ctrl.handleModerationReasonChange}
        onSelectPreset={ctrl.handleSelectModerationReasonPreset}
        onClose={ctrl.handleCloseModerationModal}
        onConfirm={(e) => void ctrl.handleConfirmModeration(e)}
      />
    </div>
  );
};

export default AdminUserDetailView;
