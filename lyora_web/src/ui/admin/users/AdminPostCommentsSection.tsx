import React from 'react';
import { AppImage, formatDateTime, formatRelativeTime } from '@/core';
import type { PostComment } from '@/features/posts';

export interface AdminPostCommentsSectionProps {
  postId: string;
  comments: PostComment[];
  totalCount: number;
  isExpanded: boolean;
  onToggleExpand: (postId: string) => void;
  onInspectAuthor: (userId: string) => void;
}

const AvatarCircle: React.FC<{
  name: string;
  avatarUrl?: string | null;
  sizeClass: string;
}> = ({ name, avatarUrl, sizeClass }) => {
  const initial = (name?.trim() || 'L').charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      <AppImage
        src={avatarUrl}
        alt={name}
        rounded
        className={`${sizeClass} shrink-0 border border-border`}
      />
    );
  }
  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-bold text-primary`}
    >
      {initial}
    </span>
  );
};

const CommentBubbleItem: React.FC<{
  comment: PostComment;
  isReply?: boolean;
  onInspectAuthor: (userId: string) => void;
}> = ({ comment, isReply = false, onInspectAuthor }) => {
  const authorName = comment.author.fullName?.trim() || 'Người dùng Lyora';

  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => onInspectAuthor(comment.author.id)}
        aria-label={`Xem hồ sơ quản trị của ${authorName}`}
        className="mt-0.5 shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <AvatarCircle
          name={authorName}
          avatarUrl={comment.author.avatarUrl}
          sizeClass={isReply ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs'}
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl border border-border bg-background/70 px-3.5 py-2">
          <button
            type="button"
            onClick={() => onInspectAuthor(comment.author.id)}
            className="text-xs font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left block"
          >
            {authorName}
          </button>

          {comment.content && (
            <p className="mt-0.5 text-xs sm:text-sm text-foreground break-words whitespace-pre-line">
              {comment.content}
            </p>
          )}

          {comment.media && (
            <div className="mt-2">
              {comment.media.type === 'IMAGE' ? (
                <AppImage
                  src={comment.media.url}
                  alt={comment.media.alt || 'Ảnh bình luận'}
                  className="max-h-44 w-auto max-w-full rounded-xl border border-border object-cover"
                />
              ) : (
                <video
                  src={comment.media.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-48 w-auto max-w-full rounded-xl border border-border bg-background"
                />
              )}
            </div>
          )}
        </div>

        <div className="mt-1 px-2 flex items-center gap-2 text-[11px] text-muted tabular-nums">
          <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
            {formatRelativeTime(comment.createdAt)}
          </time>
          {isReply && <span>· Phản hồi</span>}
        </div>
      </div>
    </div>
  );
};

export const AdminPostCommentsSection: React.FC<AdminPostCommentsSectionProps> = ({
  postId,
  comments,
  totalCount,
  isExpanded,
  onToggleExpand,
  onInspectAuthor,
}) => {
  if (comments.length === 0) {
    return (
      <div className="border-t border-border bg-background/35 px-5 py-3 text-xs text-muted">
        Bài viết này chưa có bình luận nào.
      </div>
    );
  }

  const commentIds = new Set(comments.map((c) => c.id));
  const repliesByParentId = new Map<string, PostComment[]>();
  const rootComments: PostComment[] = [];

  for (const comment of comments) {
    if (comment.parentId && commentIds.has(comment.parentId) && comment.parentId !== comment.id) {
      const group = repliesByParentId.get(comment.parentId) ?? [];
      group.push(comment);
      repliesByParentId.set(comment.parentId, group);
    } else {
      rootComments.push(comment);
    }
  }

  const hasHiddenReplies =
    !isExpanded &&
    rootComments.some((root) => (repliesByParentId.get(root.id)?.length ?? 0) > 2);
  const canToggle = rootComments.length > 2 || hasHiddenReplies || isExpanded;
  const visibleRoots = isExpanded ? rootComments : rootComments.slice(0, 2);

  return (
    <section
      aria-label="Danh sách bình luận và phản hồi"
      className="border-t border-border bg-background/35 px-4 py-3.5 sm:px-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground tabular-nums">
          Bình luận &amp; phản hồi ({totalCount.toLocaleString('vi-VN')})
        </span>

        {canToggle && (
          <button
            type="button"
            onClick={() => onToggleExpand(postId)}
            className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
          >
            {isExpanded
              ? 'Thu gọn bình luận'
              : `Xem tất cả ${totalCount.toLocaleString('vi-VN')} bình luận`}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {visibleRoots.map((root) => {
          const replies = repliesByParentId.get(root.id) ?? [];
          const visibleReplies = isExpanded ? replies : replies.slice(0, 2);
          const hiddenRepliesCount = Math.max(0, replies.length - visibleReplies.length);

          return (
            <li key={root.id} className="space-y-2">
              <CommentBubbleItem comment={root} onInspectAuthor={onInspectAuthor} />

              {replies.length > 0 && (
                <div className="ml-5 sm:ml-6 border-l-2 border-border pl-3.5 space-y-2.5">
                  {visibleReplies.map((reply) => (
                    <CommentBubbleItem
                      key={reply.id}
                      comment={reply}
                      isReply
                      onInspectAuthor={onInspectAuthor}
                    />
                  ))}

                  {hiddenRepliesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(postId)}
                      className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                    >
                      Xem thêm {hiddenRepliesCount} phản hồi
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
