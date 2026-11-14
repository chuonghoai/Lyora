import React from 'react';
import { Button, formatDate } from '@/core';
import { useDashboardController } from './dashboard.controller';
import { RefreshIcon } from '../components/AdminIcons';
import { UserStatsSection } from '../components/UserStatsSection';
import { FutureStatsSection } from '../components/FutureStatsSection';

/**
 * DashboardView — Trang chủ Trung tâm Quản trị Lyora.
 * Tích hợp dữ liệu người dùng và sức khỏe hệ thống thực tế từ API,
 * đồng thời giữ khung cấu trúc đồng bộ cho các phân hệ thống kê sắp triển khai.
 */
export const DashboardView: React.FC = () => {
  const ctrl = useDashboardController();

  return (
    <div className="space-y-8">
      {/* Page Overview Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan quản trị</h1>
          <p className="text-sm text-muted">
            Theo dõi số liệu tài khoản cộng đồng và tình trạng phản hồi của hệ thống Lyora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {ctrl.systemHealth?.timestamp && (
            <span className="text-xs text-muted tabular-nums">
              Đồng bộ: {formatDate(ctrl.systemHealth.timestamp)}
            </span>
          )}

          <Button
            variant="outline"
            isLoading={ctrl.isStatsRefreshing}
            onClick={ctrl.handleRefreshStats}
            className="h-9 px-3 py-1.5 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-background"
          >
            {!ctrl.isStatsRefreshing && <RefreshIcon className="w-3.5 h-3.5 text-muted" />}
            <span>Làm mới số liệu</span>
          </Button>
        </div>
      </header>

      {/* Primary Real User Statistics */}
      <UserStatsSection
        stats={ctrl.userStats}
        isLoading={ctrl.isStatsLoading}
        isError={ctrl.isStatsError}
        systemHealth={ctrl.systemHealth}
        isHealthLoading={ctrl.isHealthLoading}
        isHealthError={ctrl.isHealthError}
        isCheckingHealth={ctrl.isCheckingHealth}
        lastHealthReport={ctrl.lastHealthReport}
        filterQuery={ctrl.filterQuery}
        debouncedFilter={ctrl.debouncedFilter}
        activeRoleFilter={ctrl.activeRoleFilter}
        onFilterChange={ctrl.handleFilterChange}
        onClearFilter={() => ctrl.setFilterQuery('')}
        onSelectRoleFilter={ctrl.handleSelectRoleFilter}
        onViewAllUsers={ctrl.handleViewAllUsers}
        onCheckHealth={ctrl.handleCheckHealth}
        onRefresh={ctrl.handleRefreshStats}
      />

      {/* Future Statistics Modules (Waiting for Backend APIs) */}
      <FutureStatsSection />
    </div>
  );
};

export default DashboardView;
