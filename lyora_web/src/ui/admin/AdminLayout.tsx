import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminLayoutController } from './admin-layout.controller';
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar } from './components/AdminSidebar';

/**
 * AdminLayout — Khung bố cục quản trị chuẩn Ruled T-Frame.
 * Gồm Header Bar độc lập (Brand Lockup, tìm kiếm chức năng local, thông báo)
 * và Sidebar Navigation cố định góc dưới trái màn hình kèm menu tài khoản & đăng xuất.
 */
export const AdminLayout: React.FC = () => {
  const ctrl = useAdminLayoutController();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AdminHeader
        isSidebarCollapsed={ctrl.isSidebarCollapsed}
        searchQuery={ctrl.headerSearchQuery}
        isSearchOpen={ctrl.isSearchOpen}
        searchResults={ctrl.searchResults}
        searchContainerRef={ctrl.searchContainerRef}
        isNotificationOpen={ctrl.isNotificationOpen}
        notificationRef={ctrl.notificationRef}
        onSearchOpen={ctrl.handleOpenSearch}
        onSearchChange={ctrl.handleHeaderSearchChange}
        onSearchSubmit={ctrl.handleHeaderSearchSubmit}
        onSelectSearchItem={ctrl.handleSelectSearchItem}
        onClearSearch={ctrl.handleClearHeaderSearch}
        onToggleNotifications={ctrl.handleToggleNotifications}
        onCloseNotifications={ctrl.handleCloseNotifications}
        onToggleSidebarCollapse={ctrl.handleToggleSidebarCollapse}
        onOpenMobileSidebar={ctrl.handleOpenMobileSidebar}
      />

      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          pathname={ctrl.location.pathname}
          userName={ctrl.user?.fullName}
          userEmail={ctrl.user?.email}
          isCollapsed={ctrl.isSidebarCollapsed}
          isMobileOpen={ctrl.isMobileSidebarOpen}
          isLoggingOut={ctrl.isLoggingOut}
          onCloseMobile={ctrl.handleCloseMobileSidebar}
          onPlaceholderClick={ctrl.handlePlaceholderNavClick}
          onLogout={ctrl.handleLogout}
        />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1360px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
