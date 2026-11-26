import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { AppImage, CORE_CONSTANTS } from '@/core';
import webIconSymbol from '@/core/assets/web_icon_symbol.svg';
import { ROUTES } from '@/routes/paths';
import { useClientLayoutController } from './client-layout.controller';
import {
  AccessibilityIcon,
  BellIcon,
  BookmarkIcon,
  ChatBubbleOutlineIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HelpCircleIcon,
  HomeFeedIcon,
  ICON_SCALE_ANIMATION,
  LogoutIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  SmileIcon,
  UserCircleIcon,
} from './home/ClientIcons';

export const ClientLayout: React.FC = () => {
  const controller = useClientLayoutController();

  if (controller.user?.role === 'ADMIN') {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  const displayName = controller.user?.fullName?.trim() || 'Thành viên Lyora';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col" data-ui>
      {/* Top Social Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm/40">
        <div className="w-full px-3 sm:px-5 lg:px-6 h-16 flex md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-between gap-3">
          {/* Far Left: Brand Logo + Search Field */}
          <div className="justify-self-start flex items-center gap-3 flex-1 min-w-0 md:flex-initial w-full md:max-w-md">
            <Link
              to={ROUTES.CLIENT.ROOT}
              onClick={() => controller.handleSelectTab('all')}
              className="flex items-center gap-2.5 shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              aria-label="Trang chủ Lyora"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/70 border border-border p-1.5 shrink-0">
                <img src={webIconSymbol} alt="" className="h-full w-full" />
              </span>
              <span className="font-bold text-foreground text-lg tracking-tight hidden sm:inline">
                {controller.appTitle}
              </span>
            </Link>

            <form
              onSubmit={controller.handleSearchSubmit}
              role="search"
              className="relative flex-1 min-w-0"
            >
              <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={controller.searchQuery}
                onChange={controller.handleSearchChange}
                placeholder="Tìm kiếm bài viết, mọi người..."
                aria-label="Tìm kiếm trên bảng tin"
                className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
              />
              {controller.searchQuery && (
                <button
                  type="button"
                  onClick={controller.handleClearSearch}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-card hover:text-foreground cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Exact Center: Navigation Tabs (Desktop) */}
          <nav
            aria-label="Điều hướng chính cộng đồng"
            className="hidden md:flex items-center justify-center gap-1.5 justify-self-center"
          >
            <button
              type="button"
              onClick={() => controller.handleSelectTab('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${controller.isHomeRoute && controller.activeTab === 'all'
                ? 'bg-secondary text-primary'
                : 'text-muted hover:bg-background hover:text-foreground'
                }`}
            >
              <HomeFeedIcon className="w-4 h-4" />
              <span>Bảng tin</span>
            </button>

            <button
              type="button"
              onClick={() => controller.handleSelectTab('saved')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${controller.isHomeRoute && controller.activeTab === 'saved'
                ? 'bg-secondary text-primary'
                : 'text-muted hover:bg-background hover:text-foreground'
                }`}
            >
              <BookmarkIcon className="w-4 h-4" filled={controller.isHomeRoute && controller.activeTab === 'saved'} />
              <span>Đã lưu</span>
            </button>

            <button
              type="button"
              onClick={controller.handleOpenProfile}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${controller.isProfileRoute
                ? 'bg-secondary text-primary'
                : 'text-muted hover:bg-background hover:text-foreground'
                }`}
            >
              <UserCircleIcon className="w-4 h-4" />
              <span>Hồ sơ</span>
            </button>
          </nav>

          {/* Far Right: Notifications & User Account Dropdown */}
          <div className="justify-self-end flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <div ref={controller.notificationRef} className="relative">
              <button
                type="button"
                onClick={controller.handleToggleNotifications}
                aria-expanded={controller.isNotificationOpen}
                aria-haspopup="dialog"
                aria-label="Thông báo cộng đồng"
                title="Thông báo"
                className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-full"
              >
                <BellIcon
                  className={`w-6 h-6 ${ICON_SCALE_ANIMATION} ${
                    controller.isNotificationOpen
                      ? 'text-primary'
                      : 'text-foreground group-hover:text-primary group-focus-visible:text-primary'
                  }`}
                />
                {controller.unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-on-primary flex items-center justify-center ring-2 ring-card tabular-nums">
                    {controller.unreadNotificationsCount}
                  </span>
                )}
              </button>

              {controller.isNotificationOpen && (
                <div
                  role="dialog"
                  aria-label="Thông báo cộng đồng"
                  className="fixed inset-x-3 top-[68px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] md:w-[460px] min-h-[420px] max-h-[78vh] flex flex-col rounded-2xl border border-border bg-card shadow-md overflow-hidden z-40"
                >
                  <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border bg-card">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">Thông báo</h2>
                      {controller.unreadNotificationsCount > 0 && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent tabular-nums">
                          {controller.unreadNotificationsCount} chưa đọc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {controller.unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={controller.handleMarkAllNotificationsRead}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary hover:bg-secondary/50 transition-colors cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={controller.handleCloseNotifications}
                        aria-label="Đóng thông báo"
                        className="text-muted hover:text-foreground p-1.5 rounded-full hover:bg-background cursor-pointer"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                    {controller.notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          controller.handleMarkNotificationRead(item.id);
                          controller.handleCloseNotifications();
                          if (item.targetRoute === 'profile') {
                            controller.handleOpenProfile();
                          } else if (item.targetTab) {
                            controller.handleSelectTab(item.targetTab);
                          }
                        }}
                        className={`w-full text-left flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${item.isRead
                          ? 'border-border bg-card hover:bg-background'
                          : 'border-secondary-strong/70 bg-secondary/35 hover:bg-secondary/55'
                          }`}
                      >
                        <span
                          className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${item.isRead
                            ? 'border-border bg-background text-muted'
                            : 'border-secondary-strong bg-card text-primary'
                            }`}
                        >
                          <BellIcon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-[11px] font-medium text-primary pt-0.5">
                            {item.timeLabel}
                          </p>
                        </div>
                        {!item.isRead && (
                          <span
                            aria-label="Chưa đọc"
                            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="shrink-0 border-t border-border bg-background/40 px-4 py-2.5 text-center">
                    <p className="text-xs text-muted">
                      Cập nhật hoạt động tương tác và cộng đồng Lyora theo thời gian thực
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Header Message Button */}
            <button
              type="button"
              onClick={controller.handleNavigateMessages}
              title="Tin nhắn"
              aria-label="Tin nhắn"
              aria-current={controller.isMessagesRoute ? 'page' : undefined}
              className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded-full"
            >
              <ChatBubbleOutlineIcon
                className={`w-6 h-6 ${ICON_SCALE_ANIMATION} ${
                  controller.isMessagesRoute
                    ? 'text-primary'
                    : 'text-foreground group-hover:text-primary group-focus-visible:text-primary'
                }`}
              />
            </button>

            {/* Account Dropdown */}
            <div ref={controller.accountMenuRef} className="relative">
              <button
                type="button"
                onClick={controller.handleToggleAccountMenu}
                aria-expanded={controller.isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Tài khoản cá nhân"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2.5 py-1 hover:border-secondary-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="relative h-8 w-8 rounded-full shrink-0">
                  {controller.user?.avatarUrl ? (
                    <AppImage
                      src={controller.user.avatarUrl}
                      alt={displayName}
                      rounded
                      className="h-8 w-8 border border-border"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">
                      {initials}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card"
                  />
                </span>
                <span className="hidden lg:block text-left max-w-[130px] truncate text-xs font-semibold text-foreground">
                  {displayName}
                </span>
              </button>

              {controller.isAccountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Menu tài khoản người dùng"
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-card shadow-md overflow-hidden z-40"
                >
                  {controller.accountMenuPanel === 'main' && (
                    <>
                      {/* Card Trang cá nhân nhanh */}
                      <div className="p-2.5 border-b border-border bg-background/40">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={controller.handleOpenProfile}
                          className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm hover:border-secondary-strong hover:bg-secondary/25 transition-colors cursor-pointer"
                        >
                          <span className="relative h-10 w-10 rounded-full shrink-0">
                            {controller.user?.avatarUrl ? (
                              <AppImage
                                src={controller.user.avatarUrl}
                                alt={displayName}
                                rounded
                                className="h-10 w-10 border border-border"
                              />
                            ) : (
                              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-bold text-primary-active">
                                {initials}
                              </span>
                            )}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground truncate">
                              {displayName}
                            </span>
                            <span className="block text-xs text-muted truncate">
                              {controller.user?.email}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-primary">
                              Xem trang cá nhân
                            </span>
                          </span>
                        </button>
                      </div>

                      {/* Danh sách mục chính */}
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={controller.handleOpenProfile}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <UserCircleIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                              />
                            </span>
                            <span>Trang cá nhân</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            controller.handleToggleAccountMenu();
                            controller.handleSelectTab('saved');
                          }}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <BookmarkIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                                filled={false}
                              />
                            </span>
                            <span>Bài viết đã lưu</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={controller.handleNavigateMessages}
                          className={`group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer min-h-[44px] ${controller.isMessagesRoute
                            ? 'bg-secondary/60 text-primary font-semibold'
                            : 'text-foreground hover:bg-background'
                            }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <ChatBubbleOutlineIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} ${
                                  controller.isMessagesRoute
                                    ? 'text-primary'
                                    : 'text-foreground group-hover:text-primary group-focus-visible:text-primary'
                                }`}
                              />
                            </span>
                            <span>Tin nhắn</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => controller.handleNavigateAccountPanel('settings')}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <SettingsIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                              />
                            </span>
                            <span>Cài đặt & quyền riêng tư</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => controller.handleNavigateAccountPanel('accessibility')}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <AccessibilityIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                              />
                            </span>
                            <span>Màn hình & trợ năng</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => controller.handleNavigateAccountPanel('help')}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <HelpCircleIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                              />
                            </span>
                            <span>Trợ giúp & hỗ trợ</span>
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-muted" />
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={controller.handleSendFeedback}
                          className="group w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <SmileIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-foreground group-hover:text-primary group-focus-visible:text-primary`}
                              />
                            </span>
                            <span>Đóng góp ý kiến</span>
                          </span>
                        </button>

                        <div className="my-1 border-t border-border" />

                        <button
                          type="button"
                          role="menuitem"
                          disabled={controller.isLoggingOut}
                          onClick={() => void controller.handleLogout()}
                          className="group w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent border-0 shrink-0">
                              <LogoutIcon
                                className={`w-5 h-5 ${ICON_SCALE_ANIMATION} text-error group-hover:text-error/80`}
                              />
                            </span>
                            <span>{controller.isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                          </span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Submenu: Màn hình & Trợ năng */}
                  {controller.accountMenuPanel === 'accessibility' && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <button
                          type="button"
                          onClick={() => controller.handleNavigateAccountPanel('main')}
                          aria-label="Quay lại menu tài khoản"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-background text-foreground cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-bold text-foreground">Màn hình & trợ năng</h3>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Cỡ chữ hiển thị</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => controller.handleSelectFontScale('normal')}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${controller.fontScale === 'normal'
                              ? 'border-primary bg-secondary text-primary-active font-semibold'
                              : 'border-border bg-background text-foreground'
                              }`}
                          >
                            <span>Mặc định</span>
                            {controller.fontScale === 'normal' && <CheckIcon className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => controller.handleSelectFontScale('large')}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${controller.fontScale === 'large'
                              ? 'border-primary bg-secondary text-primary-active font-semibold'
                              : 'border-border bg-background text-foreground'
                              }`}
                          >
                            <span>Lớn hơn</span>
                            {controller.fontScale === 'large' && <CheckIcon className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">Giảm hiệu ứng chuyển động</p>
                          <p className="text-[11px] text-muted">Hạn chế hoạt ảnh trượt/nảy khi thao tác</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={controller.reduceMotion}
                          onClick={controller.handleToggleReduceMotion}
                          className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer ${controller.reduceMotion ? 'bg-primary justify-end' : 'bg-border justify-start'
                            }`}
                        >
                          <span className="h-5 w-5 rounded-full bg-card shadow-sm" />
                        </button>
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-[11px] text-muted">
                        Giao diện thống nhất: <strong className="text-foreground">Light Mode</strong> (Clean & Trustworthy)
                      </div>
                    </div>
                  )}

                  {/* Submenu: Cài đặt & quyền riêng tư */}
                  {controller.accountMenuPanel === 'settings' && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <button
                          type="button"
                          onClick={() => controller.handleNavigateAccountPanel('main')}
                          aria-label="Quay lại menu tài khoản"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-background text-foreground cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-bold text-foreground">Cài đặt & quyền riêng tư</h3>
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Phiên đăng nhập</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            Đang duy trì
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          Tự động làm mới token an toàn mỗi lần bạn quay lại trang chủ Lyora.
                        </p>
                        <button
                          type="button"
                          onClick={controller.handleManualRefreshSession}
                          disabled={controller.isRefreshingSession}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshIcon className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {controller.isRefreshingSession ? 'Đang làm mới...' : 'Làm mới phiên ngay'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submenu: Trợ giúp & hỗ trợ */}
                  {controller.accountMenuPanel === 'help' && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <button
                          type="button"
                          onClick={() => controller.handleNavigateAccountPanel('main')}
                          aria-label="Quay lại menu tài khoản"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-background text-foreground cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-bold text-foreground">Trợ giúp & hỗ trợ</h3>
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1.5 text-xs">
                        <p className="font-semibold text-foreground">Trung tâm Hỗ trợ Cộng đồng Lyora</p>
                        <p className="text-muted leading-relaxed">
                          Nếu gặp sự cố tài khoản hoặc cần báo cáo nội dung vi phạm, vui lòng liên hệ tổng đài hỗ trợ:
                        </p>
                        <p className="pt-1 font-mono font-semibold text-primary">
                          {CORE_CONSTANTS.SUPPORT_PHONE}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-5 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar (chuẩn DESIGN.md §6.7) */}
      <nav
        aria-label="Thanh điều hướng nhanh"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-2 py-1.5 md:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => controller.handleSelectTab('all')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${controller.isHomeRoute && controller.activeTab === 'all'
              ? 'text-primary bg-secondary/70 font-semibold'
              : 'text-muted hover:text-foreground'
              }`}
          >
            <HomeFeedIcon className="w-5 h-5" />
            <span>Bảng tin</span>
          </button>

          <button
            type="button"
            onClick={controller.handleOpenComposer}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Đăng bài</span>
          </button>

          <button
            type="button"
            onClick={() => controller.handleSelectTab('saved')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${controller.isHomeRoute && controller.activeTab === 'saved'
              ? 'text-primary bg-secondary/70 font-semibold'
              : 'text-muted hover:text-foreground'
              }`}
          >
            <BookmarkIcon className="w-5 h-5" filled={controller.isHomeRoute && controller.activeTab === 'saved'} />
            <span>Đã lưu</span>
          </button>

          <button
            type="button"
            onClick={controller.handleOpenProfile}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${controller.isProfileRoute
              ? 'text-primary bg-secondary/70 font-semibold'
              : 'text-muted hover:text-foreground'
              }`}
          >
            <UserCircleIcon className="w-5 h-5" />
            <span>Hồ sơ</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
