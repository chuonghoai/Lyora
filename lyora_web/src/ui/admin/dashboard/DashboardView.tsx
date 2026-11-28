import React from 'react';
import { Button, formatDateTime } from '@/core';
import { useDashboardController } from './dashboard.controller';
import { RefreshIcon } from '../components/AdminIcons';
import { PostStatsSection } from '../components/PostStatsSection';
import { UserStatsSection } from '../components/UserStatsSection';

export const DashboardView: React.FC = () => {
  const ctrl = useDashboardController();

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border px-5 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan quản trị</h1>
          <p className="text-sm text-muted">
            Theo dõi số liệu tài khoản, bài viết cộng đồng và tình trạng phản hồi của hệ thống Lyora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!ctrl.isHealthError && ctrl.systemHealth?.timestamp && (
            <span className="text-xs text-muted tabular-nums">
              Đồng bộ: {formatDateTime(ctrl.systemHealth.timestamp)}
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
        onCheckHealth={ctrl.handleCheckHealth}
        onRefresh={ctrl.handleRetryStats}
      />

      <PostStatsSection
        stats={ctrl.postStats}
        isLoading={ctrl.isPostStatsLoading}
        isError={ctrl.isPostStatsError}
        onRetry={ctrl.handleRetryPostStats}
        onNavigateAdminPosts={ctrl.handleNavigateAdminPosts}
      />
    </div>
  );
};

export default DashboardView;
