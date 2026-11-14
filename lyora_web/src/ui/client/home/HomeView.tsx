import React from 'react';
import {
  Button,
  Input,
  LoadingSpinner,
  AppImage,
  formatDate,
  formatCurrency,
  CORE_CONSTANTS,
} from '@/core';
import { useHomeController } from './home.controller';

export default function HomeView(): React.ReactElement {
  const controller = useHomeController();

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">
          {controller.appTitle} — Cổng Cộng Đồng (Client Portal)
        </h1>
        <p className="text-[#475569] text-base">
          Nền tảng cộng đồng số — Đăng bài viết, tương tác cảm xúc, nhắn tin và chia sẻ thời gian thực.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-[#e5e4e7]">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-3">
          Thông tin Hạ tầng & Trạng thái Hệ thống
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#334155]">
          <div>
            <strong>Nền tảng:</strong> {controller.appTitle}
          </div>
          <div>
            <strong>Trạng thái Dịch vụ (Data Layer TanStack Query):</strong>{' '}
            <span
              className={`font-semibold ${
                controller.systemHealth?.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {controller.isHealthLoading
                ? 'Đang kiểm tra...'
                : controller.systemHealth
                  ? controller.systemHealth.status.toUpperCase()
                  : 'N/A'}
            </span>
          </div>
          <div>
            <strong>Thời gian kiểm tra:</strong>{' '}
            {controller.systemHealth ? formatDate(controller.systemHealth.timestamp) : 'N/A'}
          </div>
          <div>
            <strong>Cổng hỗ trợ khách hàng:</strong>{' '}
            <code>{CORE_CONSTANTS.SUPPORT_PHONE}</code>
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
                Tìm kiếm Bài viết & Bạn bè Cộng đồng
              </h3>
              <p className="text-sm text-[#64748b]">
                Kiểm tra <code>Input</code>, <code>Button</code> và{' '}
                <code>useDebounce</code>
              </p>
            </div>
          </div>

          <Input
            label="Từ khóa tìm kiếm (useDebounce):"
            placeholder="Nhập tên người dùng, chủ đề hoặc bài viết..."
            value={controller.searchTerm}
            onChange={controller.handleSearchChange}
            helperText={`Giá trị debounce: "${controller.debouncedSearch}"`}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={controller.handleIncrement}
              isLoading={controller.isLoading}
            >
              Thao tác thử nghiệm: {controller.count}
            </Button>
            {controller.isLoading && <LoadingSpinner size="sm" />}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-3">
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Tiện ích & Hằng số dùng chung (<code>@core</code>)
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
            <code>{CORE_CONSTANTS.STORAGE_KEYS.TOKEN}</code>
          </p>

          <div ref={controller.dropdownRef} className="relative pt-2">
            <Button
              variant="outline"
              onClick={controller.handleToggleDropdown}
            >
              Kiểm tra useClickOutside {controller.isDropdownOpen ? '▲' : '▼'}
            </Button>
            {controller.isDropdownOpen && (
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

export { HomeView, HomeView as ClientHomeView };
