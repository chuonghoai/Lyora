import React from 'react';
import {
  Button,
  Input,
  LoadingSpinner,
  formatDate,
} from '@/core';
import { useDashboardController, type UserRoleFilter } from './dashboard.controller';

export default function DashboardView(): React.ReactElement {
  const controller = useDashboardController();

  // Filter recent users based on search query and role filter tab
  const filteredRecentUsers = (controller.userStats?.recentUsers || []).filter((user) => {
    const matchesSearch =
      !controller.debouncedFilter.trim() ||
      user.fullName.toLowerCase().includes(controller.debouncedFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(controller.debouncedFilter.toLowerCase());

    const matchesRole =
      controller.activeRoleFilter === 'ALL' || user.role === controller.activeRoleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* KHỐI 1: HEADER ĐIỀU HÀNH & CHỈ SỐ SỐNG HỆ THỐNG (OPERATIONS COMMAND BAR) */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-[#e2e8f0] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/20">
                QUẢN TRỊ VIÊN CẤP CAO
              </span>
              <span className="text-xs text-[#64748b]">
                Khu vực điều phối cộng đồng • ID Phiên: {controller.appTitle}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
              Trung Tâm Điều Hành & Kiểm Duyệt Cộng Đồng
            </h1>
            <p className="text-sm text-[#475569] mt-1">
              Bảng kiểm soát thành viên, luồng bài viết chia sẻ, kiểm duyệt báo cáo vi phạm, tương tác nhắn tin thời gian thực và hạ tầng lõi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => void controller.handleRefreshStats()}
              isLoading={controller.isStatsRefreshing}
              className="text-xs"
            >
              Làm mới số liệu
            </Button>
            <Button
              variant="primary"
              onClick={controller.handleSimulateSync}
              isLoading={controller.isSubmitting}
              className="text-xs shadow-md shadow-blue-500/20"
            >
              Đồng bộ dữ liệu ({controller.adminActions})
            </Button>
          </div>
        </div>

        {/* System Pulse Row */}
        <div className="mt-5 pt-4 border-t border-[#f1f5f9] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-[#64748b]">API & WebSocket Core</p>
              <p className="font-semibold text-[#0f172a]">
                {controller.isHealthLoading
                  ? 'Đang kiểm tra...'
                  : controller.systemHealth?.status === 'ok'
                    ? 'HOẠT ĐỘNG'
                    : 'CẢNH BÁO'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-[#64748b]">Cơ Sở Dữ Liệu</p>
              <p className="font-semibold text-[#0f172a]">
                {controller.isStatsLoading
                  ? 'Đang kết nối...'
                  : controller.userStats
                    ? 'KẾT NỐI BÌNH THƯỜNG'
                    : 'KHÔNG SẴN SÀNG'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-[#64748b]">Bộ Nhớ Đệm Redis</p>
              <p className="font-semibold text-[#0f172a]">SẴN SÀNG (IN-MEMORY)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="text-[#64748b]">Kiểm Tra Gần Nhất</p>
              <p className="font-semibold text-[#0f172a]">
                {controller.systemHealth ? formatDate(controller.systemHealth.timestamp) : 'Vừa xong'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI 2: TÁC VỤ QUẢN TRỊ NHANH (ACTION HUB - NHIỀU BUTTON CHỨC NĂNG // TODO) */}
      <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0f172a] uppercase tracking-wide">
              Thao Tác Quản Trị Trọng Yếu (Operational Action Hub)
            </h2>
            <p className="text-xs text-[#64748b]">
              Các lệnh điều phối cộng đồng, kiểm duyệt nội dung và quản trị nền tảng tức thì.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569]">
            16 Tác Vụ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nhóm 1: Quản Trị Thành Viên & Phân Quyền */}
          <div className="p-3.5 rounded-xl border border-[#cbd5e1]/60 bg-[#f8fafc] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Thành Viên & Phân Quyền
              </span>
              <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={controller.handleCreateUser}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                + Thêm Thành Viên Mới
              </button>
              <button
                type="button"
                onClick={controller.handleExportUsers}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                ↓ Xuất Danh Sách User (CSV)
              </button>
              <button
                type="button"
                onClick={controller.handleManageRoles}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                ⚙ Phân Quyền Vai Trò (RBAC)
              </button>
              <button
                type="button"
                onClick={controller.handleBatchLockUsers}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-amber-50 hover:text-amber-700 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🔒 Khóa Tài Khoản Vi Phạm
              </button>
            </div>
          </div>

          {/* Nhóm 2: Nội Dung & Kiểm Duyệt Bài Viết */}
          <div className="p-3.5 rounded-xl border border-[#cbd5e1]/60 bg-[#f8fafc] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Bài Viết & Kiểm Duyệt
              </span>
              <span className="w-2 h-2 rounded-full bg-[#aa3bff]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={controller.handleCreateAnnouncement}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#aa3bff]/5 hover:text-[#aa3bff] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                📢 Đăng Thông Báo Chính Thức
              </button>
              <button
                type="button"
                onClick={controller.handleModeratePosts}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#aa3bff]/5 hover:text-[#aa3bff] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                👁 Kiểm Duyệt Luồng Bài Viết
              </button>
              <button
                type="button"
                onClick={controller.handleReviewReports}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#aa3bff]/5 hover:text-[#aa3bff] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🚩 Xử Lý Báo Cáo Vi Phạm
              </button>
              <button
                type="button"
                onClick={controller.handleHideViolatingContent}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-red-50 hover:text-red-700 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🚫 Ẩn / Gỡ Nội Dung Vi Phạm
              </button>
            </div>
          </div>

          {/* Nhóm 3: Tương Tác, Nhắn Tin & Tính Năng */}
          <div className="p-3.5 rounded-xl border border-[#cbd5e1]/60 bg-[#f8fafc] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Nhắn Tin & Tính Năng
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={controller.handleManageFeatureFlags}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🎛 Bật/Tắt Tính Năng Web
              </button>
              <button
                type="button"
                onClick={controller.handleMonitorRealtimeSockets}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                💬 Giám Sát Chat & Cuộc Gọi
              </button>
              <button
                type="button"
                onClick={controller.handleManageCommunityGroups}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🌐 Quản Lý Nhóm Cộng Đồng
              </button>
              <button
                type="button"
                onClick={controller.handleBroadcastNotification}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🔔 Phát Thông Báo Toàn Hệ Thống
              </button>
            </div>
          </div>

          {/* Nhóm 4: Hạ Tầng & Bảo Mật */}
          <div className="p-3.5 rounded-xl border border-[#cbd5e1]/60 bg-[#f8fafc] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Hạ Tầng & Bảo Mật
              </span>
              <span className="w-2 h-2 rounded-full bg-[#0f172a]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={controller.handlePurgeCache}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-amber-50 hover:text-amber-800 text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                ⚡ Làm Mới Cache Redis
              </button>
              <button
                type="button"
                onClick={controller.handleBackupDatabase}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                💾 Sao Lưu Cơ Sở Dữ Liệu
              </button>
              <button
                type="button"
                onClick={controller.handleViewAuditLogs}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                📜 Nhật Ký An Ninh (Audit Logs)
              </button>
              <button
                type="button"
                onClick={controller.handleConfigureSecurity}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-white hover:bg-[#2563eb]/5 hover:text-[#2563eb] text-[#334155] border border-[#e2e8f0] rounded-lg transition-colors cursor-pointer"
              >
                🛡 Cấu Hình Chính Sách Bảo Mật
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI 3: DASHBOARD THỐNG KÊ NGƯỜI DÙNG THỰC TẾ (USER METRICS & RECENT USERS TABLE) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">
              Thống Kê Thành Viên & Tài Khoản Cộng Đồng
            </h2>
            <p className="text-xs text-[#64748b]">
              Dữ liệu tổng hợp realtime trực tiếp từ bảng cơ sở dữ liệu `users`.
            </p>
          </div>
          {controller.isStatsLoading && (
            <div className="flex items-center gap-2 text-xs text-[#2563eb]">
              <LoadingSpinner size="sm" />
              <span>Đang tải số liệu...</span>
            </div>
          )}
        </div>

        {/* 4 KPI Cards (Anti-default discipline: Không icon vòng tròn màu, số liệu rõ ràng) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Tổng Thành Viên
            </p>
            <p className="text-3xl font-extrabold text-[#0f172a] tracking-tight mt-1">
              {controller.userStats?.totalUsers ?? '—'}
            </p>
            <div className="mt-2 text-xs text-[#475569] flex items-center justify-between">
              <span>Đang hoạt động:</span>
              <span className="font-semibold text-emerald-600">
                {controller.userStats?.activeCount ?? 0}
              </span>
            </div>
            <div className="text-xs text-[#475569] flex items-center justify-between mt-0.5">
              <span>Bị khóa / Tạm ngưng:</span>
              <span className="font-semibold text-red-600">
                {controller.userStats?.inactiveCount ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Thành Viên Cộng Đồng (Client)
            </p>
            <p className="text-3xl font-extrabold text-[#2563eb] tracking-tight mt-1">
              {controller.userStats?.clientCount ?? '—'}
            </p>
            <p className="text-xs text-[#64748b] mt-2">
              Người dùng tham gia đăng bài viết, bình luận, nhắn tin và chia sẻ trên Cổng Người Dùng.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Ban Điều Hành (Staff & Admin)
            </p>
            <p className="text-3xl font-extrabold text-[#0f172a] tracking-tight mt-1">
              {(controller.userStats?.adminCount ?? 0) + (controller.userStats?.staffCount ?? 0)}
            </p>
            <div className="mt-2 text-xs text-[#475569] flex items-center justify-between">
              <span>Quản trị viên (Admin):</span>
              <span className="font-semibold text-[#2563eb]">
                {controller.userStats?.adminCount ?? 0}
              </span>
            </div>
            <div className="text-xs text-[#475569] flex items-center justify-between mt-0.5">
              <span>Kiểm duyệt viên (Staff):</span>
              <span className="font-semibold text-[#aa3bff]">
                {controller.userStats?.staffCount ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Tốc Độ Gia Nhập Mới
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-1">
              +{controller.userStats?.newUsersThisMonth ?? 0}
            </p>
            <div className="mt-2 text-xs text-[#475569] flex items-center justify-between">
              <span>Đăng ký hôm nay:</span>
              <span className="font-semibold text-emerald-600">
                +{controller.userStats?.newUsersToday ?? 0}
              </span>
            </div>
            <div className="text-xs text-[#475569] flex items-center justify-between mt-0.5">
              <span>Đăng ký tháng này:</span>
              <span className="font-semibold text-[#0f172a]">
                {controller.userStats?.newUsersThisMonth ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Bảng Danh Sách 5 Người Dùng Đăng Ký Mới Nhất (Recent Users Table) */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                Thành Viên Gia Nhập Mới Nhất
              </h3>
              <p className="text-xs text-[#64748b]">
                Theo dõi tức thì các tài khoản vừa đăng ký tham gia cộng đồng Lyora.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'CLIENT', 'ADMIN', 'STAFF'] as UserRoleFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => controller.handleSelectRoleFilter(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    controller.activeRoleFilter === tab
                      ? 'bg-[#2563eb] text-white font-semibold'
                      : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'Tất cả'
                    : tab === 'CLIENT'
                      ? 'Thành viên'
                      : tab === 'ADMIN'
                        ? 'Admin'
                        : 'Staff'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
            <Input
              placeholder="Lọc nhanh danh sách theo họ tên hoặc email..."
              value={controller.filterQuery}
              onChange={controller.handleFilterChange}
              helperText={
                controller.debouncedFilter
                  ? `Đang lọc theo từ khóa: "${controller.debouncedFilter}"`
                  : undefined
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Họ Và Tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Ngày Đăng Ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredRecentUsers.length > 0 ? (
                  filteredRecentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0f172a]">
                        {user.fullName}
                      </td>
                      <td className="py-3 px-4 text-[#475569] font-mono">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/30'
                              : user.role === 'STAFF'
                                ? 'bg-[#aa3bff]/10 text-[#aa3bff] border border-[#aa3bff]/30'
                                : 'bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {user.isActive ? 'Kích hoạt' : 'Đang khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#64748b]">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#64748b]">
                      {controller.isStatsLoading
                        ? 'Đang tải danh sách thành viên...'
                        : 'Không tìm thấy thành viên phù hợp với điều kiện lọc.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b]">
            <span>Hiển thị tối đa 5 thành viên đăng ký mới nhất theo thời gian thực.</span>
            <button
              type="button"
              onClick={controller.handleExportUsers}
              className="font-medium text-[#2563eb] hover:underline cursor-pointer"
            >
              Quản lý toàn bộ thành viên →
            </button>
          </div>
        </div>
      </section>

      {/* KHỐI 4: PLACEHOLDERS CHO CÁC PHÂN HỆ DASHBOARD TƯƠNG LAI (ROADMAP DASHBOARDS // TODO) */}
      <section className="space-y-4">
        <div className="border-b border-[#e2e8f0] pb-2">
          <h2 className="text-base font-bold text-[#0f172a] uppercase tracking-wide">
            Khu Vực Phân Hệ Thống Kê Tương Lai (Roadmap Dashboards)
          </h2>
          <p className="text-xs text-[#64748b]">
            Các dashboard dành riêng cho bài viết, tương tác, kiểm duyệt cộng đồng và truyền thông thời gian thực.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Placeholder 1: Bài Viết & Mức Độ Tương Tác Cộng Đồng */}
          <div className="bg-white rounded-xl p-5 border border-dashed border-[#cbd5e1] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  LỘ TRÌNH GIAI ĐOẠN 2
                </span>
                <span className="text-xs text-[#94a3b8]">Bảng: posts, comments & reactions</span>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                Thống Kê Bài Viết & Tương Tác Cộng Đồng
              </h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                Biểu đồ số lượng bài viết chia sẻ mới theo ngày/tuần, lượt bày tỏ cảm xúc, bình luận, chia sẻ lại và các chủ đề thảo luận nổi bật.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-2">
              <div className="text-2xl font-bold text-[#94a3b8] tracking-tight">
                0 Bài Viết / 0 Tương Tác
              </div>
              <p className="text-[11px] text-[#64748b]">
                // TODO: Sẽ hiển thị khi hoàn thiện bảng dữ liệu `posts`, `comments` & `reactions`.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={controller.handleModeratePosts}
              className="w-full text-xs"
            >
              Xem Kế Hoạch Dashboard Bài Viết
            </Button>
          </div>

          {/* Placeholder 2: Trung Tâm Kiểm Duyệt & Báo Cáo Vi Phạm */}
          <div className="bg-white rounded-xl p-5 border border-dashed border-[#cbd5e1] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  LỘ TRÌNH GIAI ĐOẠN 2
                </span>
                <span className="text-xs text-[#94a3b8]">Bảng: reports & moderation_logs</span>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                Kiểm Duyệt Nội Dung & Báo Cáo Vi Phạm
              </h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                Thống kê số lượng báo cáo vi phạm chờ xử lý, tỷ lệ bài viết/bình luận bị ẩn hoặc khóa và tiến độ giải quyết của đội ngũ Staff.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-2">
              <div className="text-2xl font-bold text-[#94a3b8] tracking-tight">
                0 Báo Cáo Chờ Duyệt
              </div>
              <p className="text-[11px] text-[#64748b]">
                // TODO: Sẽ kích hoạt khi hoàn thiện bảng `reports` & `moderation_logs`.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={controller.handleReviewReports}
              className="w-full text-xs"
            >
              Xem Kế Hoạch Trung Tâm Kiểm Duyệt
            </Button>
          </div>

          {/* Placeholder 3: Nhắn Tin Thời Gian Thực, Cuộc Gọi & Bảo Mật */}
          <div className="bg-white rounded-xl p-5 border border-dashed border-[#cbd5e1] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  LỘ TRÌNH GIAI ĐOẠN 3
                </span>
                <span className="text-xs text-[#94a3b8]">Bảng: messages, calls & audit_logs</span>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                Nhắn Tin Realtime, Cuộc Gọi & An Ninh Mạng
              </h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                Theo dõi lưu lượng tin nhắn 1-1 / nhóm, phiên gọi thoại/video đang kết nối qua WebSocket, tỷ lệ xác thực OTP và cảnh báo bảo mật.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-2">
              <div className="text-2xl font-bold text-[#94a3b8] tracking-tight">
                0 Phiên Kết Nối Realtime
              </div>
              <p className="text-[11px] text-[#64748b]">
                // TODO: Sẽ tích hợp cùng WebSocket Gateway, `messages` & `audit_logs`.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={controller.handleMonitorRealtimeSockets}
              className="w-full text-xs"
            >
              Xem Kế Hoạch Giám Sát Realtime
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export { DashboardView, DashboardView as AdminDashboardView };
