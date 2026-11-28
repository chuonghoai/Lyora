import React, { useEffect } from 'react';
import { AppImage } from '@/core';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from '../components/AdminIcons';
import type { AdminPostsController } from './admin-posts.controller';
import { AdminDialog } from './AdminDialog';

export interface AdminMediaLightboxModalProps {
  controller: AdminPostsController;
}

export const AdminMediaLightboxModal: React.FC<
  AdminMediaLightboxModalProps
> = ({ controller }) => {
  const lightbox = controller.lightbox;
  const totalItems = lightbox?.items.length ?? 0;

  useEffect(() => {
    if (!lightbox || totalItems <= 1) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        controller.handlePrevLightbox();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        controller.handleNextLightbox();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, lightbox, totalItems]);

  const currentItem = lightbox ? lightbox.items[lightbox.index] : undefined;

  return (
    <AdminDialog
      open={Boolean(lightbox && currentItem)}
      onClose={controller.handleCloseLightbox}
      labelledBy="admin-media-lightbox-title"
      closedBy="any"
      maxWidthClassName="max-w-5xl"
    >
      <div className="flex max-h-[min(92dvh,860px)] flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1
              id="admin-media-lightbox-title"
              className="text-sm font-semibold text-foreground truncate"
            >
              {currentItem?.fileName || currentItem?.alt || 'Xem chi tiết phương tiện'}
            </h1>
            {totalItems > 1 && lightbox && (
              <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted tabular-nums">
                {lightbox.index + 1} / {totalItems}
              </span>
            )}
          </div>

          <button
            type="button"
            autoFocus
            onClick={controller.handleCloseLightbox}
            aria-label="Đóng khung xem phương tiện"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex flex-1 min-h-[260px] items-center justify-center overflow-auto bg-foreground/5 p-3 sm:p-5">
          {totalItems > 1 && (
            <button
              type="button"
              onClick={controller.handlePrevLightbox}
              aria-label="Phương tiện trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm hover:bg-card transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}

          {currentItem?.type === 'VIDEO' ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              controls
              playsInline
              autoPlay
              className="max-h-[78dvh] w-auto max-w-full rounded-xl bg-foreground"
            />
          ) : currentItem ? (
            <AppImage
              src={currentItem.url}
              alt={currentItem.alt || 'Ảnh đính kèm bài viết'}
              objectFit="contain"
              className="max-h-[78dvh] w-auto max-w-full rounded-xl"
            />
          ) : null}

          {totalItems > 1 && (
            <button
              type="button"
              onClick={controller.handleNextLightbox}
              aria-label="Phương tiện tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm hover:bg-card transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </AdminDialog>
  );
};
