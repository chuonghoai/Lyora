import React from 'react';
import { AppImage } from '@/core';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './ClientIcons';
import type { PostFeedController } from './post-feed.controller';

export interface MediaLightboxModalProps {
  controller: Pick<
    PostFeedController,
    'lightbox' | 'handleCloseLightbox' | 'handlePrevLightbox' | 'handleNextLightbox'
  >;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({ controller }) => {
  if (!controller.lightbox) {
    return null;
  }

  const currentItem = controller.lightbox.items[controller.lightbox.index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem phương tiện phóng to"
      onClick={controller.handleCloseLightbox}
      className="fixed inset-0 z-[65] bg-foreground/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={controller.handleCloseLightbox}
        aria-label="Đóng xem phương tiện"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      {controller.lightbox.items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            controller.handlePrevLightbox();
          }}
          aria-label="Phương tiện trước"
          className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
      >
        {currentItem?.type === 'VIDEO' ? (
          <video
            src={currentItem.url}
            controls
            playsInline
            autoPlay
            className="max-h-[78vh] w-auto max-w-full rounded-xl bg-card"
          />
        ) : (
          <AppImage
            src={currentItem?.url}
            alt={currentItem?.alt || 'Ảnh bài viết'}
            className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain bg-card"
          />
        )}
        <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground tabular-nums">
          {controller.lightbox.index + 1} / {controller.lightbox.items.length}
        </span>
      </div>

      {controller.lightbox.items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            controller.handleNextLightbox();
          }}
          aria-label="Phương tiện tiếp theo"
          className="absolute right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-background cursor-pointer"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
