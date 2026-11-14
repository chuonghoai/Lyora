import React from 'react';
import { Link } from 'react-router-dom';
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
  isNotificationOpen: boolean;
  notificationRef: React.RefObject<HTMLDivElement | null>;
  onSearchOpen: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSelectSearchItem: (item: AdminNavItem) => void;
  onClearSearch: () => void;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onToggleSidebarCollapse: () => void;
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isSidebarCollapsed,
  searchQuery,
  isSearchOpen,
  searchResults,
  searchContainerRef,
  isNotificationOpen,
  notificationRef,
  onSearchOpen,
  onSearchChange,
  onSearchSubmit,
  onSelectSearchItem,
  onClearSearch,
  onToggleNotifications,
  onCloseNotifications,
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
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-background transition-colors"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebarCollapse}
          aria-label={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          title={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground hover:bg-background transition-colors"
        >
          <SidebarToggleIcon className="w-4 h-4" collapsed={isSidebarCollapsed} />
        </button>

        <Link
          to={ROUTES.ADMIN.DASHBOARD}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
        >
          <img src={webIconLockup} alt="Lyora" className="h-6 sm:h-7 w-auto" />
          <span className="hidden sm:inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
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
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground"
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
              <span className="text-[11px] font-medium text-muted">Chức năng quản trị</span>
              <span className="text-[11px] text-muted tabular-nums">
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
                      onClick={() => onSelectSearchItem(item)}
                      className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-background transition-colors"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                          <AdminNavIcon name={item.icon} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground truncate">
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-muted truncate">
                            {item.groupLabel}
                          </span>
                        </span>
                      </span>

                      <span
                        className={[
                          'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          item.implemented
                            ? 'border-secondary-strong bg-secondary text-primary'
                            : 'border-border bg-background text-muted',
                        ].join(' ')}
                      >
                        {item.implemented ? 'Đang mở' : 'Sắp mở'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right: Notification Center */}
      <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={onToggleNotifications}
            aria-expanded={isNotificationOpen}
            aria-haspopup="dialog"
            aria-label="Mở thông báo hệ thống"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-background transition-colors"
          >
            <BellIcon className="w-4 h-4" />
          </button>

          {isNotificationOpen && (
            <div
              role="dialog"
              aria-label="Trung tâm thông báo"
              className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-md overflow-hidden z-40"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Thông báo hệ thống</h2>
                <button
                  type="button"
                  onClick={onCloseNotifications}
                  aria-label="Đóng thông báo"
                  className="text-muted hover:text-foreground"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 text-center space-y-1.5">
                <p className="text-sm font-medium text-foreground">Chưa có thông báo mới</p>
                <p className="text-xs text-muted leading-relaxed">
                  {/* // TODO: Kết nối nguồn thông báo thời gian thực cho quản trị viên */}
                  Luồng cảnh báo kiểm duyệt và sự kiện hệ thống sẽ hiển thị tại đây khi API thông báo được tích hợp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
