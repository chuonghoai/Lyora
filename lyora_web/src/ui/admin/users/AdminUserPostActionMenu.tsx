import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useClickOutside } from '@/core';
import {
  EyeOffIcon,
  FlagIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from '../components/AdminIcons';

export interface AdminUserPostActionMenuProps {
  postId: string;
  onHidePost: () => void;
  onFlagViolation: () => void;
  onRemovePost: () => void;
  disabled?: boolean;
}

export const AdminUserPostActionMenu: React.FC<AdminUserPostActionMenuProps> = ({
  postId,
  onHidePost,
  onFlagViolation,
  onRemovePost,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useClickOutside(containerRef, handleClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectAction = (callback: () => void) => {
    setIsOpen(false);
    callback();
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Hành động quản trị cho bài viết"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `admin-user-post-menu-${postId}` : undefined}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MoreHorizontalIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          id={`admin-user-post-menu-${postId}`}
          role="menu"
          aria-label="Tùy chọn quản trị bài viết"
          className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-xl border border-border bg-card py-1.5 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectAction(onHidePost)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-background"
          >
            <EyeOffIcon className="w-3.5 h-3.5 text-muted shrink-0" />
            <span>Ẩn bài viết</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectAction(onFlagViolation)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-warning/10 hover:text-warning transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-warning/10"
          >
            <FlagIcon className="w-3.5 h-3.5 text-warning shrink-0" />
            <span>Đánh dấu vi phạm</span>
          </button>

          <div className="my-1 border-t border-border" role="separator" />

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectAction(onRemovePost)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-error/10"
          >
            <TrashIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Gỡ bài viết</span>
          </button>
        </div>
      )}
    </div>
  );
};
