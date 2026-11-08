import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155]">
      <header className="bg-white border-b border-[#e5e4e7]">
        <div className="max-w-[1126px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0f172a] text-white font-bold text-lg">
              A
            </span>
            <div>
              <span className="font-bold text-[#0f172a] text-lg tracking-tight">
                {appTitle}
              </span>
              <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/30">
                Trung Tâm Quản Trị
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to={ROUTES.ADMIN.DASHBOARD}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                location.pathname.startsWith(ROUTES.ADMIN.ROOT)
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30'
                  : 'text-[#334155] hover:bg-[#f8fafc]'
              }`}
            >
              Bảng điều khiển
            </Link>
            <Link
              to={ROUTES.CLIENT.ROOT}
              className="px-3.5 py-2 rounded-lg text-sm font-medium border border-[#cbd5e1] text-[#334155] bg-white hover:bg-[#f8fafc] transition-colors duration-150"
            >
              ← Về Cổng Khách Hàng
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
