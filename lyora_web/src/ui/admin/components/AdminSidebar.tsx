import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClickOutside } from '@/core';
import { ROUTES } from '@/routes/paths';
import webIconSymbol from '@/core/assets/web_icon_symbol.svg';
import webIconLockup from '@/core/assets/web_icon_lockup.svg';
import { ADMIN_NAV_GROUPS, isAdminNavActive, type AdminNavItem } from '../adminNav';
import {
  AdminNavIcon,
  ChevronUpIcon,
  CloseIcon,
  ExternalArrowIcon,
  LogoutIcon,
} from './AdminIcons';

interface AdminSidebarProps {
  pathname: string;
  userEmail?: string;
  userName?: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isLoggingOut: boolean;
  onCloseMobile: () => void;
  onPlaceholderClick: (item: AdminNavItem) => void;
  onLogout: () => void;
}

const SidebarNavContent: React.FC<{
  pathname: string;
  collapsed: boolean;
  onPlaceholderClick: (item: AdminNavItem) => void;
}> = ({ pathname, collapsed, onPlaceholderClick }) => {
  return (
    <nav aria-label="Điều hướng quản trị" className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-muted">
              {group.label}
            </p>
          ) : (
            <div className="mx-2 my-2 border-t border-border first:hidden" aria-hidden="true" />
          )}

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = isAdminNavActive(pathname, item);
              const baseClasses = [
                'group relative w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-150',
                collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2',
                isActive
                  ? 'bg-secondary text-primary font-semibold'
                  : item.implemented
                    ? 'text-foreground hover:bg-background font-medium'
                    : 'text-muted hover:bg-background hover:text-foreground font-medium',
              ].join(' ');

              if (item.implemented) {
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={baseClasses}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <AdminNavIcon
                          name={item.icon}
                          className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted group-hover:text-foreground'}`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  {/* // TODO: Chuyển thành <Link to={item.path}> khi route quản trị được kích hoạt */}
                  <button
                    type="button"
                    onClick={() => onPlaceholderClick(item)}
                    title={collapsed ? `${item.label} — Sắp ra mắt` : item.todoNote}
                    className={baseClasses}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <AdminNavIcon name={item.icon} className="w-4 h-4 text-muted group-hover:text-foreground" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && (
                      <span className="shrink-0 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        Sắp mở
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

const SidebarAccountFooter: React.FC<{
  pathname: string;
  displayName: string;
  userEmail?: string;
  collapsed: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}> = ({ pathname, displayName, userEmail, collapsed, isLoggingOut, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, collapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const initial = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <div ref={containerRef} className="relative shrink-0 mt-auto border-t border-border p-3 bg-card">
      {isOpen && (
        <div
          role="menu"
          aria-label="Tùy chọn tài khoản quản trị"
          className={[
            'animate-slide-up absolute bottom-full mb-2 rounded-xl border border-border bg-card shadow-md overflow-hidden z-40',
            collapsed ? 'left-3 w-60' : 'left-3 right-3',
          ].join(' ')}
        >
          <div className="px-3.5 py-2.5 border-b border-border bg-background/60">
            <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
            {userEmail && <p className="text-[11px] text-muted truncate">{userEmail}</p>}
          </div>

          <div className="p-1.5 space-y-1">
            <Link
              to={ROUTES.CLIENT.ROOT}
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background hover:text-primary transition-colors"
            >
              <span>Về Cổng Người Dùng</span>
              <ExternalArrowIcon className="w-3.5 h-3.5 text-muted" />
            </Link>

            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              <LogoutIcon className="w-3.5 h-3.5 text-error" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={collapsed ? `${displayName} — Mở tùy chọn tài khoản` : undefined}
        className={[
          'w-full flex items-center rounded-lg border border-border bg-background hover:border-secondary-strong transition-colors cursor-pointer',
          collapsed ? 'justify-center p-2' : 'justify-between gap-2.5 px-2.5 py-2',
        ].join(' ')}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-primary">
            {initial}
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card bg-success"
            />
          </span>
          {!collapsed && (
            <span className="text-left min-w-0">
              <span className="block text-xs font-semibold text-foreground truncate">
                {displayName}
              </span>
              {userEmail && (
                <span className="block text-[11px] text-muted truncate">{userEmail}</span>
              )}
            </span>
          )}
        </span>

        {!collapsed && (
          <ChevronUpIcon
            className={`w-4 h-4 text-muted transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        )}
      </button>
    </div>
  );
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pathname,
  userEmail,
  userName,
  isCollapsed,
  isMobileOpen,
  isLoggingOut,
  onCloseMobile,
  onPlaceholderClick,
  onLogout,
}) => {
  const displayName = userName?.trim() || 'Quản trị viên';

  return (
    <>
      {/* Desktop Sidebar: cố định theo viewport bên trái, phần footer neo cứng góc dưới trái */}
      <aside
        className={[
          'hidden lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col lg:shrink-0 bg-card border-r border-border transition-[width] duration-200',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
        ].join(' ')}
      >
        <div
          className={[
            'shrink-0 flex items-center border-b border-border px-3 py-3',
            isCollapsed ? 'justify-center' : 'gap-2.5',
          ].join(' ')}
        >
          <img src={webIconSymbol} alt="" aria-hidden="true" className="w-7 h-7 shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Lyora Admin</p>
              <p className="text-[11px] text-muted truncate">Không gian điều hành</p>
            </div>
          )}
        </div>

        <SidebarNavContent
          pathname={pathname}
          collapsed={isCollapsed}
          onPlaceholderClick={onPlaceholderClick}
        />

        <SidebarAccountFooter
          pathname={pathname}
          displayName={displayName}
          userEmail={userEmail}
          collapsed={isCollapsed}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile / Tablet Slide-over Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng quản trị"
        >
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-foreground/30"
          />

          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-card border-r border-border shadow-md">
            <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-border">
              <Link to={ROUTES.ADMIN.DASHBOARD} onClick={onCloseMobile} className="flex items-center gap-2">
                <img src={webIconLockup} alt="Lyora" className="h-6 w-auto" />
                <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted">
                  Admin
                </span>
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Đóng thanh điều hướng"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <SidebarNavContent
              pathname={pathname}
              collapsed={false}
              onPlaceholderClick={onPlaceholderClick}
            />

            <SidebarAccountFooter
              pathname={pathname}
              displayName={displayName}
              userEmail={userEmail}
              collapsed={false}
              isLoggingOut={isLoggingOut}
              onLogout={onLogout}
              onNavigate={onCloseMobile}
            />
          </div>
        </div>
      )}
    </>
  );
};
