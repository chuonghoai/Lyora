import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export const ClientLayout: React.FC = () => {
  const location = useLocation();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155]">
      <header className="bg-white border-b border-[#e5e4e7]">
        <div className="max-w-[1126px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#2563eb] text-white font-bold text-lg shadow-md shadow-blue-500/30">
              L
            </span>
            <div>
              <span className="font-bold text-[#0f172a] text-lg tracking-tight">
                {appTitle}
              </span>
              <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#aa3bff]/10 text-[#aa3bff] border border-[#aa3bff]/50">
                Cổng Khách Hàng
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to={ROUTES.CLIENT.ROOT}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                location.pathname === ROUTES.CLIENT.ROOT
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30'
                  : 'text-[#334155] hover:bg-[#f8fafc]'
              }`}
            >
              Trang chủ Client
            </Link>
            <Link
              to={ROUTES.ADMIN.DASHBOARD}
              className="px-3.5 py-2 rounded-lg text-sm font-medium border border-[#cbd5e1] text-[#334155] bg-white hover:bg-[#f8fafc] transition-colors duration-150"
            >
              Chuyển sang Cổng Quản Trị →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1126px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
