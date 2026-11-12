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
import { useDashboardController } from './dashboard.controller';

export default function DashboardView(): React.ReactElement {
  const controller = useDashboardController();

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">
          {controller.appTitle} — Trung Tâm Quản Trị (Admin Portal)
        </h1>
        <p className="text-[#475569] text-base">
          Quản lý sản phẩm, đơn hàng, khóa bản quyền và thống kê toàn hệ thống.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-[#e5e4e7]">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-3">
          Trạng thái Dịch vụ & Hạ tầng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-[#334155]">
          <div>
            <strong>Hệ điều hành / Portal:</strong> {controller.appTitle}
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
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0">
              <AppImage
                src="https://placehold.co/160x160/0f172a/FFFFFF?text=Admin"
                alt="Admin Avatar"
                rounded
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">
                Bộ lọc & Tìm kiếm Quản trị
              </h3>
              <p className="text-sm text-[#64748b]">
                Kiểm tra <code>Input</code>, <code>Button</code> và{' '}
                <code>useDebounce</code>
              </p>
            </div>
          </div>

          <Input
            label="Lọc đơn hàng / người dùng (useDebounce):"
            placeholder="Nhập mã đơn, mã key, hoặc email khách..."
            value={controller.filterQuery}
            onChange={controller.handleFilterChange}
            helperText={`Bộ lọc kích hoạt: "${controller.debouncedFilter}"`}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={controller.handleSimulateSync}
              isLoading={controller.isSubmitting}
            >
              Đồng bộ dữ liệu: {controller.adminActions}
            </Button>
            {controller.isSubmitting && <LoadingSpinner size="sm" />}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-3">
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Thống kê nhanh & Tiện ích Core
          </h3>

          <p className="text-sm text-[#334155]">
            <strong>Doanh thu ngày (mẫu):</strong> {formatCurrency(15000000)}
          </p>
          <p className="text-sm text-[#334155]">
            <strong>Kích thước trang mặc định:</strong>{' '}
            {CORE_CONSTANTS.DEFAULT_PAGE_SIZE} mục
          </p>

          <div ref={controller.menuRef} className="relative pt-2">
            <Button
              variant="outline"
              onClick={controller.handleToggleMenu}
            >
              Tùy chọn thao tác {controller.isMenuOpen ? '▲' : '▼'}
            </Button>
            {controller.isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#cbd5e1] rounded-lg p-3 shadow-lg z-10 text-sm text-[#334155] min-w-[200px]">
                <ul className="space-y-1">
                  <li className="p-1 hover:bg-[#f8fafc] rounded cursor-pointer">
                    Xuất báo cáo PDF
                  </li>
                  <li className="p-1 hover:bg-[#f8fafc] rounded cursor-pointer">
                    Sao lưu dữ liệu
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export { DashboardView, DashboardView as AdminDashboardView };
