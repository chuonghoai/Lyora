import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import webIconSymbol from '@/core/assets/web_icon_symbol.svg';
import { ROUTES } from '@/routes/paths';
import { useClientLayoutController } from './client-layout.controller';

export const ClientLayout: React.FC = () => {
  const controller = useClientLayoutController();

  if (controller.user?.role === 'ADMIN') {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground" data-ui>
      <header className="bg-card border-b border-border">
        <div className="max-w-281.5 mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={ROUTES.CLIENT.ROOT} className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-lg">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 border border-border p-1.5 shrink-0">
                <img src={webIconSymbol} alt="" className="h-full w-full" />
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-foreground text-lg tracking-tight">
                  {controller.appTitle}
                </span>
                <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-background text-muted border border-border">
                  Cổng Người Dùng
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-3 shrink-0">
            <Link
              to={ROUTES.CLIENT.ROOT}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                controller.location.pathname === ROUTES.CLIENT.ROOT
                  ? 'bg-secondary text-primary-active'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              Trang chủ Client
            </Link>

            {controller.isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right text-xs hidden sm:block">
                  <p className="font-semibold text-foreground">{controller.user?.fullName}</p>
                  <p className="text-muted">{controller.user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void controller.handleLogout()}
                  disabled={controller.isLoggingOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-error/10 text-error hover:bg-error/15 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {controller.isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-colors duration-150"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-281.5 mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
