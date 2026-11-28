import React from 'react';
import { AppImage, Button, EmptyState, formatDateTime } from '@/core';
import type { AdminPostItem, PostVisibility } from '@/features/posts';
import {
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  RotateCcwIcon,
  TrashIcon,
} from '../components/AdminIcons';
import type { AdminPostsController } from './admin-posts.controller';

export interface AdminPostsTableProps {
  controller: AdminPostsController;
}

const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  PUBLIC: 'Công khai',
  FRIENDS: 'Bạn bè',
  PRIVATE: 'Riêng tư',
};

function renderModerationBadge(post: AdminPostItem) {
  if (post.moderationStatus === 'HIDDEN') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning whitespace-nowrap">
        <EyeOffIcon className="w-3 h-3" />
        <span>Đã ẩn</span>
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success whitespace-nowrap">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
      <span>Đang hiển thị</span>
    </span>
  );
}

function summarizeMediaLabel(post: AdminPostItem): string | null {
  if (!post.media || post.media.length === 0) return null;
  let images = 0;
  let videos = 0;
  let audios = 0;
  for (const m of post.media) {
    if (m.type === 'IMAGE') images += 1;
    else if (m.type === 'VIDEO') videos += 1;
    else if (m.type === 'AUDIO') audios += 1;
  }
  const parts: string[] = [];
  if (images > 0) parts.push(`${images} ảnh`);
  if (videos > 0) parts.push(`${videos} video`);
  if (audios > 0) parts.push(`${audios} ghi âm`);
  return parts.join(' · ');
}

export const AdminPostsTable: React.FC<AdminPostsTableProps> = ({
  controller,
}) => {
  const startItem =
    controller.paginationMeta.totalItems === 0
      ? 0
      : (controller.paginationMeta.page - 1) * controller.paginationMeta.limit +
        1;
  const endItem = Math.min(
    controller.paginationMeta.page * controller.paginationMeta.limit,
    controller.paginationMeta.totalItems,
  );

  if (controller.posts.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          compact
          title={
            controller.hasActiveFilters
              ? 'Không tìm thấy bài viết khớp bộ lọc'
              : 'Chưa có bài viết nào trên hệ thống'
          }
          description={
            controller.hasActiveFilters
              ? 'Hãy thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại bộ lọc để xem toàn bộ bài viết.'
              : 'Khi thành viên hoặc Ban Quản Trị xuất bản bài viết mới, danh sách sẽ hiển thị tại đây.'
          }
          action={
            controller.hasActiveFilters
              ? {
                  label: 'Đặt lại bộ lọc',
                  onClick: controller.handleResetFilters,
                  variant: 'outline',
                }
              : {
                  label: 'Đăng bài quản trị đầu tiên',
                  onClick: controller.handleOpenCreateModal,
                  variant: 'primary',
                }
          }
          className="border-none"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Container-Adaptive Semantic Data Table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="admin-posts-table-caption"
        className="lyora-table-region focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <table className="lyora-responsive-table text-left">
          <caption id="admin-posts-table-caption" className="sr-only">
            Danh sách bài viết trên hệ thống Lyora
          </caption>
          <thead className="bg-background/95 backdrop-blur-[2px]">
            <tr>
              <th
                scope="col"
                className="border-b border-border py-3 px-4 text-xs font-medium text-muted min-w-[260px]"
              >
                Bài viết
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-3 text-xs font-medium text-muted min-w-[170px]"
              >
                Tác giả
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-3 text-xs font-medium text-muted whitespace-nowrap"
              >
                Phạm vi
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-3 text-xs font-medium text-muted whitespace-nowrap"
              >
                Trạng thái
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-3 text-xs font-medium text-muted text-right whitespace-nowrap"
              >
                Tương tác
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-3 text-xs font-medium text-muted text-right whitespace-nowrap"
              >
                Thời gian đăng
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 px-4 text-xs font-medium text-muted text-right whitespace-nowrap"
              >
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {controller.posts.map((post) => {
              const mediaSummary = summarizeMediaLabel(post);
              const firstVisual = post.media.find((m) => m.type === 'IMAGE');
              const isRestoring = controller.restoringPostId === post.id;

              return (
                <tr
                  key={post.id}
                  className="hover:bg-background/50 transition-colors"
                >
                  <th
                    scope="row"
                    className="border-b border-border py-3.5 px-4 align-top font-normal max-w-[360px]"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {firstVisual ? (
                        <AppImage
                          src={firstVisual.url}
                          alt={firstVisual.alt || 'Ảnh bài viết'}
                          className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : mediaSummary ? (
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      ) : null}

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => controller.handleOpenDetail(post.id)}
                          className="block w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                        >
                          <span className="line-clamp-2 break-words">
                            {post.content.trim() || (
                              <span className="italic font-normal text-muted">
                                (Bài viết chỉ đính kèm phương tiện)
                              </span>
                            )}
                          </span>
                        </button>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] border border-border/80">
                            #{post.id.slice(0, 8)}
                          </span>
                          {mediaSummary && (
                            <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-[11px] border border-border/80">
                              <ImageIcon className="w-3 h-3" />
                              <span>{mediaSummary}</span>
                            </span>
                          )}
                        </div>

                        {post.moderationStatus === 'HIDDEN' &&
                          post.moderationReason && (
                            <p className="border-l-2 border-warning pl-2 text-xs text-warning line-clamp-1">
                              Lý do ẩn: {post.moderationReason}
                            </p>
                          )}
                      </div>
                    </div>
                  </th>

                  <td className="border-b border-border py-3.5 px-3 align-top max-w-[220px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {post.author.avatarUrl ? (
                        <AppImage
                          src={post.author.avatarUrl}
                          alt={post.author.fullName || 'Tác giả'}
                          rounded
                          className="h-8 w-8 shrink-0 border border-border"
                        />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold text-primary-active">
                          {(post.author.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}

                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="min-w-0 truncate text-sm font-medium text-foreground">
                            {post.author.fullName || 'Chưa cập nhật'}
                          </p>
                          {post.author.role === 'ADMIN' && (
                            <span className="shrink-0 rounded border border-secondary-strong bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-primary-active whitespace-nowrap">
                              Quản trị
                            </span>
                          )}
                        </div>
                        <p className="min-w-0 truncate text-xs text-muted">
                          {post.author.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-border py-3.5 px-3 align-top whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground">
                      {VISIBILITY_LABELS[post.visibility]}
                    </span>
                  </td>

                  <td className="border-b border-border py-3.5 px-3 align-top whitespace-nowrap">
                    {renderModerationBadge(post)}
                  </td>

                  <td className="border-b border-border py-3.5 px-3 align-top text-right tabular-nums whitespace-nowrap">
                    <div>
                      <p className="text-sm text-foreground">
                        {post.reactionCount.toLocaleString('vi-VN')}{' '}
                        <span className="text-xs text-muted">cảm xúc</span>
                      </p>
                      <p className="text-xs text-muted">
                        {post.commentCount.toLocaleString('vi-VN')} bình luận
                      </p>
                    </div>
                  </td>

                  <td className="border-b border-border py-3.5 px-3 align-top text-right text-xs text-muted tabular-nums whitespace-nowrap">
                    {formatDateTime(post.createdAt)}
                  </td>

                  <td className="border-b border-border py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <div className="inline-flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => controller.handleOpenDetail(post.id)}
                        aria-label={`Xem chi tiết bài viết của ${post.author.fullName || 'tác giả'}`}
                        className="inline-flex shrink-0 min-h-9 sm:min-h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <EyeIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>Chi tiết</span>
                      </button>

                      {post.moderationStatus === 'HIDDEN' ? (
                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={() => void controller.handleRestorePost(post)}
                          className="inline-flex shrink-0 min-h-9 sm:min-h-8 items-center gap-1 rounded-lg border border-secondary-strong bg-secondary/50 px-2.5 text-xs font-medium text-primary-active hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <RotateCcwIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{isRestoring ? 'Đang mở...' : 'Khôi phục'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => controller.handleOpenHideModal(post)}
                          className="inline-flex shrink-0 min-h-9 sm:min-h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <EyeOffIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>Ẩn</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => controller.handleOpenRemoveModal(post)}
                        aria-label={`Gỡ bỏ bài viết của ${post.author.fullName || 'tác giả'}`}
                        className="inline-flex shrink-0 min-h-9 min-w-9 sm:min-h-8 sm:min-w-8 items-center justify-center rounded-lg border border-transparent text-muted hover:border-error/30 hover:bg-error/10 hover:text-error transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border px-5 py-3.5 bg-card">
        <p className="text-xs text-muted tabular-nums">
          Hiển thị{' '}
          <span className="font-medium text-foreground">
            {startItem}–{endItem}
          </span>{' '}
          trong tổng số{' '}
          <span className="font-medium text-foreground">
            {controller.paginationMeta.totalItems.toLocaleString('vi-VN')}
          </span>{' '}
          bài viết
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={
              !controller.paginationMeta.hasPrevPage ||
              controller.isPostsFetching
            }
            onClick={() =>
              controller.handleChangePage(controller.paginationMeta.page - 1)
            }
            className="min-h-10 sm:min-h-8 px-3 py-1 text-xs"
          >
            Trang trước
          </Button>
          <span className="px-2 text-xs text-muted tabular-nums">
            Trang{' '}
            <strong className="font-medium text-foreground">
              {controller.paginationMeta.page}
            </strong>{' '}
            / {Math.max(1, controller.paginationMeta.totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={
              !controller.paginationMeta.hasNextPage ||
              controller.isPostsFetching
            }
            onClick={() =>
              controller.handleChangePage(controller.paginationMeta.page + 1)
            }
            className="min-h-10 sm:min-h-8 px-3 py-1 text-xs"
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};
