import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/core';
import type { AppNotification } from '@/features/notifications';
import { ROUTES } from '@/routes/paths';
import webIconLockup from '@/core/assets/web_icon_lockup.svg';
import type { AdminNavItem, AdminNavSearchEntry } from '../adminNav';
import {
  AdminNavIcon,
  BellIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  SidebarToggleIcon,
} from './AdminIcons';

interface AdminHeaderProps {
  isSidebarCollapsed: boolean;
  searchQuery: string;
  isSearchOpen: boolean;
  searchResults: AdminNavSearchEntry[];
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  isLoadingNotifications: boolean;
  isMarkingAllNotificationsRead: boolean;
  notificationsRef: React.RefObject<HTMLDivElement | null>;
  onSearchOpen: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectSearchItem: (item: AdminNavItem) => void;
  onClearSearch: () => void;
  onToggleNotifications: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onMarkAllNotificationsRead: () => void;
  onToggleSidebarCollapse: () => void;
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isSidebarCollapsed,
  searchQuery,
  isSearchOpen,
  searchResults,
  searchContainerRef,
  notifications,
  unreadNotificationsCount,
  isNotificationsOpen,
  isLoadingNotifications,
  isMarkingAllNotificationsRead,
  notificationsRef,
  onSearchOpen,
  onSearchChange,
  onSearchSubmit,
  onSelectSearchItem,
  onClearSearch,
  onToggleNotifications,
  onSelectNotification,
  onMarkAllNotificationsRead,
  onToggleSidebarCollapse,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 shrink-0 bg-card border-b border-border px-4 sm:px-6 py-2.5 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
      {/* Left: Drawer/Collapse control + Brand Lockup */}
      <div className="order-1 flex items-center gap-2.5 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Mở menu điều hướng"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebarCollapse}
          aria-label={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          title={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <SidebarToggleIcon className="w-4 h-4" collapsed={isSidebarCollapsed} />
        </button>

        <Link
          to={ROUTES.ADMIN.DASHBOARD}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
        >
          <img src={webIconLockup} alt="Lyora" className="h-6 sm:h-7 w-auto" />
          <span className="hidden sm:inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted">
            Quản trị
          </span>
        </Link>
      </div>

      {/* Center: Local Admin Feature Quick Finder */}
      <div
        ref={searchContainerRef}
        className="order-3 md:order-2 w-full md:w-auto md:flex-1 md:max-w-md relative border-t border-border pt-2 md:border-t-0 md:pt-0"
      >
        <form onSubmit={onSearchSubmit} role="search" className="relative flex items-center">
          <SearchIcon className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onFocus={onSearchOpen}
            onClick={onSearchOpen}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm chức năng quản trị..."
            aria-label="Tìm nhanh chức năng quản trị"
            aria-expanded={isSearchOpen}
            aria-controls="admin-feature-search-list"
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {isSearchOpen && (
          <div
            id="admin-feature-search-list"
            role="listbox"
            aria-label="Danh sách chức năng quản trị"
            className="absolute left-0 right-0 mt-1.5 rounded-xl border border-border bg-card shadow-md overflow-hidden z-40"
          >
            <div className="px-3 py-2 border-b border-border bg-background/60 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground/80">Chức năng quản trị</span>
              <span className="text-xs text-foreground/80 tabular-nums">
                {searchResults.length} mục
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="px-4 py-5 text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Không tìm thấy chức năng phù hợp
                </p>
                <p className="text-xs text-muted">
                  Thử nhập từ khóa khác như “người dùng”, “bài viết”, “kiểm duyệt”...
                </p>
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-border/60 py-1">
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!item.implemented}
                      onClick={() => onSelectSearchItem(item)}
                      className={`w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        item.implemented
                          ? 'hover:bg-background cursor-pointer'
                          : 'opacity-65 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                          <AdminNavIcon name={item.icon} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground truncate">
                            {item.label}
                          </span>
                          <span className="block text-xs text-muted truncate">
                            {item.groupLabel}
                          </span>
                        </span>
                      </span>

                      <span
                        className={[
                          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          item.implemented
                            ? 'border-secondary-strong bg-secondary text-primary'
                            : 'border-border bg-card text-muted',
                        ].join(' ')}
                      >
                        {item.implemented ? 'Đang mở' : 'Chưa mở'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right Notifications + Context Pill */}
      <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={onToggleNotifications}
            aria-label="Thông báo quản trị"
            aria-expanded={isNotificationsOpen}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <BellIcon className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-primary tabular-nums">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              role="region"
              aria-label="Danh sách thông báo quản trị"
              className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-md overflow-hidden z-40"
            >
              <div className="px-3.5 py-2.5 border-b border-border bg-background/60 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Thông báo quản trị
                </span>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    disabled={isMarkingAllNotificationsRead}
                    onClick={onMarkAllNotificationsRead}
                    className="text-[11px] font-medium text-primary hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {isLoadingNotifications ? (
                <div className="p-4 text-center text-xs text-muted">
                  Đang tải thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-5 text-center space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Chưa có thông báo mới
                  </p>
                  <p className="text-[11px] text-muted">
                    Các khiếu nại bài viết từ thành viên sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-border/70">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectNotification(item)}
                        className={`w-full px-3.5 py-2.5 text-left transition-colors hover:bg-background cursor-pointer flex items-start gap-2.5 ${
                          item.isRead ? 'bg-card' : 'bg-secondary/25'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                            item.isRead ? 'bg-border' : 'bg-primary'
                          }`}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          <p className="text-[11px] text-muted tabular-nums">
                            {formatRelativeTime(item.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <span className="hidden md:inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80">
          Trung tâm điều hành
        </span>
      </div>
    </header>
  );
};
