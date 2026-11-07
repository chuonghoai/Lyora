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
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  // Kiểm tra biến môi trường nạp từ web_shared/.env
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const appTitle = import.meta.env.VITE_APP_TITLE;
  const timeout = import.meta.env.VITE_API_TIMEOUT;

  // Kiểm tra Type từ web_shared
  const mockResponse: ApiResponse<{ role: UserRole }> = {
    success: true,
    data: { role: 'CLIENT' },
    timestamp: new Date().toISOString(),
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#00796B', marginBottom: '0.5rem' }}>
          {appTitle} — Cổng Khách Hàng (Client Portal)
        </h1>
        <p style={{ color: '#64748B' }}>
          Nền tảng tiếp nhận và xử lý phản ánh chất lượng không gian đô thị.
        </p>
      </header>

      {/* 1. Kiểm tra biến môi trường từ web_shared/.env */}
      <section style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#1E293B', marginBottom: '1rem' }}>
          Biến môi trường nạp từ <code>web_shared/.env</code>:
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#334155' }}>
          <li style={{ padding: '0.25rem 0' }}><strong>VITE_APP_TITLE:</strong> {appTitle}</li>
          <li style={{ padding: '0.25rem 0' }}><strong>VITE_API_BASE_URL:</strong> {apiBaseUrl}</li>
          <li style={{ padding: '0.25rem 0' }}><strong>VITE_API_TIMEOUT:</strong> {timeout}ms</li>
          <li style={{ padding: '0.25rem 0' }}><strong>Axios Client BaseURL:</strong> {apiClient.defaults.baseURL}</li>
        </ul>
      </section>

      {/* 2. Kiểm tra Components & Hooks từ web_shared */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Card Thao tác UI */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem auto' }}>
            <AppImage
              src="https://placehold.co/160x160/00796B/FFFFFF?text=Client"
              alt="Client Logo"
              rounded
            />
          </div>

          <Input
            label="Tìm kiếm phản ánh (useDebounce):"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            helperText={`Giá trị debounce: "${debouncedSearch}"`}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="primary"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setCount((c) => c + 1);
                  setIsLoading(false);
                }, 500);
              }}
              isLoading={isLoading}
            >
              Tăng số lần: {count}
            </Button>

            {isLoading && <LoadingSpinner size="sm" />}
          </div>
        </div>

        {/* Card Kiểm tra Utilities & Constants */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', color: '#1E293B', marginBottom: '1rem' }}>
            Kiểm tra Tiện ích & Hằng số dùng chung:
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
            <strong>Định dạng thời gian (formatDate):</strong> {formatDate(new Date())}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
            <strong>Định dạng tiền tệ (formatCurrency):</strong> {formatCurrency(2500000)}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
            <strong>Hằng số Storage Token Key:</strong> <code>{SHARED_CONSTANTS.STORAGE_KEYS.TOKEN}</code>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem' }}>
            <strong>Vai trò từ Shared Types (UserRole):</strong> <code>{mockResponse.data.role}</code>
          </p>

          {/* Test useClickOutside */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <Button
              variant="outline"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Kiểm tra useClickOutside {isDropdownOpen ? '▲' : '▼'}
            </Button>
            {isDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10 }}>
                Nhấn ra ngoài vùng này để đóng!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
