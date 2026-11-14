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
      <section className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          {controller.appTitle} — Cổng Cộng Đồng (Client Portal)
        </h1>
        <p className="text-muted text-base">
          Nền tảng cộng đồng số — Đăng bài viết, tương tác cảm xúc, nhắn tin và chia sẻ thời gian thực.
        </p>
      </section>

      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Thông tin Hạ tầng & Trạng thái Hệ thống
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground">
          <div>
            <strong className="font-semibold">Nền tảng:</strong> {controller.appTitle}
          </div>
          <div>
            <strong className="font-semibold">Trạng thái Dịch vụ (Data Layer TanStack Query):</strong>{' '}
            <span
              className={`font-semibold ${
                controller.systemHealth?.status === 'ok' ? 'text-success' : 'text-warning'
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
            <strong className="font-semibold">Thời gian kiểm tra:</strong>{' '}
            <span className="tabular-nums">
              {controller.systemHealth ? formatDate(controller.systemHealth.timestamp) : 'N/A'}
            </span>
          </div>
          <div>
            <strong className="font-semibold">Cổng hỗ trợ cộng đồng:</strong>{' '}
            <code>{CORE_CONSTANTS.SUPPORT_PHONE}</code>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0">
              <AppImage
                src="https://placehold.co/160x160/2563EB/FFFFFF?text=Client"
                alt="Client Avatar"
                rounded
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Tìm kiếm Bài viết & Bạn bè Cộng đồng
              </h3>
              <p className="text-sm text-muted">
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

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Tiện ích & Hằng số dùng chung (<code>@core</code>)
          </h3>

          <p className="text-sm text-foreground">
            <strong className="font-semibold">Thời gian hiện tại (formatDate):</strong>{' '}
            <span className="tabular-nums">{formatDate(new Date())}</span>
          </p>
          <p className="text-sm text-foreground">
            <strong className="font-semibold">Định dạng tiền tệ (formatCurrency):</strong>{' '}
            <span className="tabular-nums">{formatCurrency(2500000)}</span>
          </p>
          <p className="text-sm text-foreground">
            <strong className="font-semibold">Storage Token Key:</strong>{' '}
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
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl p-3 shadow-md z-10 text-sm text-foreground">
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
