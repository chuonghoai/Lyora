import React from 'react';
import type { PostVisibility } from '@/features/posts';
import { GlobeIcon, LockIcon, UsersIcon } from './AdminIcons';

export interface AdminPostVisibilityChipProps {
  visibility: PostVisibility;
  className?: string;
}

export const AdminPostVisibilityChip: React.FC<AdminPostVisibilityChipProps> = ({
  visibility,
  className = '',
}) => {
  if (visibility === 'PUBLIC') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground whitespace-nowrap ${className}`}
      >
        <GlobeIcon className="w-3.5 h-3.5 text-muted" />
        <span>Công khai</span>
      </span>
    );
  }

  if (visibility === 'FRIENDS') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground whitespace-nowrap ${className}`}
      >
        <UsersIcon className="w-3.5 h-3.5 text-info" />
        <span>Bạn bè</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-foreground whitespace-nowrap ${className}`}
    >
      <LockIcon className="w-3.5 h-3.5 text-warning" />
      <span>Riêng tư</span>
    </span>
  );
};
