import { useState, useRef } from 'react';
import {
  Button,
  Input,
  LoadingSpinner,
  AppImage,
  useDebounce,
  useClickOutside,
  formatDate,
  formatCurrency,
  SHARED_CONSTANTS,
  apiClient,
  type ApiResponse,
  type UserRole,
} from '@shared';

export default function AdminDashboardPage() {
  const [adminActions, setAdminActions] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedFilter = useDebounce(filterQuery, 350);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';
  const timeout = import.meta.env.VITE_API_TIMEOUT || '15000';

  const adminProfile: ApiResponse<{ role: UserRole; name: string }> = {
    success: true,
    data: { role: 'ADMIN', name: 'Quản trị viên Hệ thống' },
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">
          {appTitle} — Trung Tâm Quản Trị (Admin Portal)
        </h1>
        <p className="text-[#475569] text-base">
          Bảng điều khiển quản lý danh mục phần mềm, đơn hàng, người dùng và kho Cyber Keys.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-[#e5e4e7]">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-3">
          Trạng thái kết nối Backend API
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-[#334155]">
          <div>
            <strong>Base URL:</strong> <code>{apiBaseUrl}</code>
          </div>
          <div>
            <strong>Timeout:</strong> {timeout}ms
          </div>
          <div>
            <strong>Health Endpoint:</strong>{' '}
            <code>{SHARED_CONSTANTS.API_ENDPOINTS.HEALTH}</code>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0">
              <AppImage
                src="https://placehold.co/128x128/2563eb/FFFFFF?text=Admin"
                alt="Admin Avatar"
                rounded
              />
            </div>
            <div>
              <div className="font-bold text-[#0f172a]">
                {adminProfile.data.name}
              </div>
              <div className="text-sm text-[#64748b]">
                Vai trò: <code>{adminProfile.data.role}</code>
              </div>
            </div>
          </div>

          <Input
            label="Lọc danh sách đơn hàng / license key (useDebounce):"
            placeholder="Nhập mã đơn hoặc email khách hàng..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            helperText={`Bộ lọc đang áp dụng: "${debouncedFilter}"`}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => {
                  setAdminActions((prev) => prev + 1);
                  setIsSubmitting(false);
                }, 400);
              }}
              isLoading={isSubmitting}
            >
              Phê duyệt tác vụ: {adminActions}
            </Button>
            {isSubmitting && <LoadingSpinner size="sm" />}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-3">
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Chỉ số & Cấu hình Quản trị
          </h3>
          <p className="text-sm text-[#334155]">
            <strong>Thời điểm truy cập:</strong> {formatDate(new Date())}
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Doanh thu ngày (mẫu):</strong> {formatCurrency(15000000)}
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Kích thước trang mặc định:</strong>{' '}
            {SHARED_CONSTANTS.DEFAULT_PAGE_SIZE} mục
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Axios Instance BaseURL:</strong>{' '}
            <code>{apiClient.defaults.baseURL}</code>
          </p>

          <div ref={menuRef} className="relative pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              Menu Quản Trị Nhanh {isMenuOpen ? '▲' : '▼'}
            </Button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#cbd5e1] rounded-lg p-3 shadow-lg z-10 text-sm text-[#334155]">
                Menu điều phối hệ thống (Bấm ra ngoài để đóng)
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
