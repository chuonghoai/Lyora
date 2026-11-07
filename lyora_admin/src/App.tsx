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
} from '@lyora/web-shared';
import type { ApiResponse, UserRole } from '@lyora/web-shared';

export default function App() {
  const [adminActions, setAdminActions] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedFilter = useDebounce(filterQuery, 350);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  // Kiểm tra biến môi trường nạp từ web_shared/.env
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const appTitle = import.meta.env.VITE_APP_TITLE;
  const timeout = import.meta.env.VITE_API_TIMEOUT;

  // Kiểm tra Types & Contracts từ web_shared
  const adminProfile: ApiResponse<{ role: UserRole; name: string }> = {
    success: true,
    data: { role: 'ADMIN', name: 'Quản trị viên Hệ thống' },
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
        <h1 style={{ color: '#00796B', margin: 0 }}>
          {appTitle} — Trung Tâm Quản Trị (Admin Portal)
        </h1>
        <p style={{ color: '#64748B', marginTop: '0.25rem' }}>
          Bảng điều khiển và phân phối phản ánh dành cho Ban Quản Trị & Cán Bộ Điều Phối.
        </p>
      </header>

      {/* 1. Kiểm tra biến môi trường từ web_shared/.env */}
      <section style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '1rem', color: '#1E293B', marginBottom: '0.75rem' }}>
          Cấu hình môi trường chia sẻ (<code>web_shared/.env</code>):
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div><strong>Tiêu đề ứng dụng:</strong> {appTitle}</div>
          <div><strong>Base URL Backend:</strong> {apiBaseUrl}</div>
          <div><strong>Thời gian timeout:</strong> {timeout}ms</div>
          <div style={{ gridColumn: 'span 2' }}>
            <strong>Axios Instance BaseURL:</strong> <code>{apiClient.defaults.baseURL}</code>
          </div>
        </div>
      </section>

      {/* 2. Kiểm tra Components & Hooks dùng chung */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Box Điều khiển tác vụ */}
        <section style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '64px', height: '64px' }}>
              <AppImage
                src="https://placehold.co/128x128/00796B/FFFFFF?text=Admin"
                alt="Admin Avatar"
                rounded
              />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1E293B' }}>{adminProfile.data.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Vai trò: <code>{adminProfile.data.role}</code></div>
            </div>
          </div>

          <Input
            label="Lọc hồ sơ phản ánh (useDebounce):"
            placeholder="Mã hồ sơ hoặc người gửi..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            helperText={`Bộ lọc đang áp dụng: "${debouncedFilter}"`}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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

        {/* Box Tiện ích & Hằng số */}
        <section style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.5rem', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', color: '#1E293B', marginBottom: '1rem' }}>
            Xác minh Định dạng & Hằng số:
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
            <strong>Thời điểm truy cập:</strong> {formatDate(new Date())}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
            <strong>Ngân sách dự chi:</strong> {formatCurrency(15000000)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
            <strong>Kích thước trang mặc định:</strong> {SHARED_CONSTANTS.DEFAULT_PAGE_SIZE} mục
          </p>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '1rem' }}>
            <strong>Endpoint phản ánh:</strong> <code>{SHARED_CONSTANTS.API_ENDPOINTS.REPORTS}</code>
          </p>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <Button
              variant="secondary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              Menu Điều Hướng (useClickOutside) {isMenuOpen ? '▲' : '▼'}
            </Button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10 }}>
                Menu quản trị nhanh (Bấm ra ngoài để đóng)
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
