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

export default function ClientHomePage() {
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';
  const timeout = import.meta.env.VITE_API_TIMEOUT || '15000';

  const mockResponse: ApiResponse<{ role: UserRole }> = {
    success: true,
    data: { role: 'CLIENT' },
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">
          {appTitle} — Cổng Khách Hàng (Client Portal)
        </h1>
        <p className="text-[#475569] text-base">
          Hệ sinh thái thương mại điện tử giải pháp phần mềm bản quyền & Cyber Keys.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-[#e5e4e7]">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-3">
          Cấu hình môi trường hợp nhất (<code>lyora_web/.env</code>)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#334155]">
          <div>
            <strong>VITE_APP_TITLE:</strong> {appTitle}
          </div>
          <div>
            <strong>VITE_API_BASE_URL:</strong> <code>{apiBaseUrl}</code>
          </div>
          <div>
            <strong>VITE_API_TIMEOUT:</strong> {timeout}ms
          </div>
          <div>
            <strong>Axios BaseURL:</strong>{' '}
            <code>{apiClient.defaults.baseURL}</code>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0">
              <AppImage
                src="https://placehold.co/160x160/2563eb/FFFFFF?text=Client"
                alt="Client Avatar"
                rounded
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">
                Tìm kiếm Phần mềm & License Key
              </h3>
              <p className="text-sm text-[#64748b]">
                Kiểm tra <code>Input</code>, <code>Button</code> và{' '}
                <code>useDebounce</code>
              </p>
            </div>
          </div>

          <Input
            label="Từ khóa sản phẩm (useDebounce):"
            placeholder="Nhập tên phần mềm hoặc mã key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            helperText={`Giá trị debounce: "${debouncedSearch}"`}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setCount((c) => c + 1);
                  setIsLoading(false);
                }, 400);
              }}
              isLoading={isLoading}
            >
              Thao tác thử nghiệm: {count}
            </Button>
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-3">
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Tiện ích & Hằng số dùng chung (<code>@/shared</code>)
          </h3>

          <p className="text-sm text-[#334155]">
            <strong>Thời gian hiện tại (formatDate):</strong>{' '}
            {formatDate(new Date())}
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Định dạng tiền tệ (formatCurrency):</strong>{' '}
            {formatCurrency(2500000)}
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Storage Token Key:</strong>{' '}
            <code>{SHARED_CONSTANTS.STORAGE_KEYS.TOKEN}</code>
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Vai trò hiện tại (UserRole):</strong>{' '}
            <code>{mockResponse.data.role}</code>
          </p>

          <div ref={dropdownRef} className="relative pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Kiểm tra useClickOutside {isDropdownOpen ? '▲' : '▼'}
            </Button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#cbd5e1] rounded-lg p-3 shadow-lg z-10 text-sm text-[#334155]">
                Nhấn ra ngoài vùng này để tự động đóng hộp thoại!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
