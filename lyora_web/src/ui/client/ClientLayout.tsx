import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useClientLayoutController } from './client-layout.controller';

export const ClientLayout: React.FC = () => {
  const controller = useClientLayoutController();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155]">
      <header className="bg-white border-b border-[#e5e4e7]">
        <div className="max-w-[1126px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.CLIENT.ROOT} className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#2563eb] text-white font-bold text-lg shadow-md shadow-blue-500/30">
                L
              </span>
              <div>
                <span className="font-bold text-[#0f172a] text-lg tracking-tight">
                  {controller.appTitle}
                </span>
                <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#aa3bff]/10 text-[#aa3bff] border border-[#aa3bff]/50">
                  Cổng Khách Hàng
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to={ROUTES.CLIENT.ROOT}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                controller.location.pathname === ROUTES.CLIENT.ROOT
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30'
                  : 'text-[#334155] hover:bg-[#f8fafc]'
              }`}
            >
              Trang chủ Client
            </Link>

            {controller.user?.role === 'ADMIN' && (
              <Link
                to={ROUTES.ADMIN.DASHBOARD}
                className="px-3.5 py-2 rounded-lg text-sm font-medium border border-[#cbd5e1] text-[#334155] bg-white hover:bg-[#f8fafc] transition-colors duration-150"
              >
                Cổng Quản Trị →
              </Link>
            )}

            {controller.isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-[#e2e8f0]">
                <div className="text-right text-xs">
                  <p className="font-semibold text-[#0f172a]">{controller.user?.fullName}</p>
                  <p className="text-[#64748b]">{controller.user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void controller.handleLogout()}
                  disabled={controller.isLoggingOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {controller.isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md shadow-blue-500/30 transition-colors duration-150"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-[1126px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
