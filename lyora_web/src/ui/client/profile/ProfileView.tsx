import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/core";
import { ArrowLeftIcon, CloseIcon } from "../home/ClientIcons";
import { MediaLightboxModal } from "../home/MediaLightboxModal";
import { PostDetailModal } from "../home/PostDetailModal";
import { PostReactionsModal } from "../home/PostReactionsModal";
import { ProfileAboutSection } from "./ProfileAboutSection";
import { ProfileActivitySection } from "./ProfileActivitySection";
import { ProfileEditModal } from "./ProfileEditModal";
import { ProfileFriendsSection } from "./ProfileFriendsSection";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileOverviewSection } from "./ProfileOverviewSection";
import { useProfileController } from "./profile.controller";

const ProfileSkeleton: React.FC = () => (
  <div className="mx-auto w-full max-w-[1440px] space-y-5">
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="h-44 sm:h-56 lg:h-64 bg-secondary/50 animate-pulse" />
      <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="-mt-16 h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full border-4 border-card bg-secondary/70 animate-pulse" />
          <div className="space-y-2.5 flex-1 pt-2">
            <div className="h-7 w-56 rounded-lg bg-secondary/50 animate-pulse" />
            <div className="h-4 w-80 max-w-full rounded-lg bg-border/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)_330px] 2xl:grid-cols-[330px_minmax(0,1fr)_350px] gap-5">
      <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
      <div className="h-80 rounded-2xl border border-border bg-card animate-pulse" />
      <div className="hidden xl:block h-64 rounded-2xl border border-border bg-card animate-pulse" />
    </div>
  </div>
);

export const ProfileView: React.FC = () => {
  const controller = useProfileController();

  if (controller.isLoading) {
    return <ProfileSkeleton />;
  }

  if (controller.isError || !controller.profile) {
    return (
      <div className="mx-auto w-full max-w-2xl py-10">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-3">
          <h1 className="text-xl font-bold text-foreground">
            Không tìm thấy hồ sơ người dùng
          </h1>
          <p className="text-sm text-muted">
            Hồ sơ bạn đang tìm có thể không tồn tại hoặc tạm thời không truy cập
            được.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={controller.handleNavigateBackToFeed}
            >
              Về bảng tin
            </Button>
            <Button variant="primary" onClick={controller.handleRefetchProfile}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      {/* Thanh điều hướng ngữ cảnh trên cùng */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={controller.handleNavigateBackToFeed}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Bảng tin</span>
          </button>

          <span className="text-xs sm:text-sm font-medium text-foreground truncate">
            {controller.isOwnProfile
              ? "Trang hồ sơ cá nhân"
              : `Hồ sơ thành viên · ${controller.profile.fullName}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!controller.isOwnProfile && (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                controller.handleOpenUserProfile(
                  controller.currentUser?.id ?? "me",
                )
              }
              className="h-8 px-3 py-1 text-xs text-primary"
            >
              Về hồ sơ của tôi
            </Button>
          )}
          {controller.profile.isPreviewFallback && (
            <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              Giao diện xem trước
            </span>
          )}
        </div>
      </div>

      {/* Header Hồ sơ: Ảnh bìa, Avatar, Hành động & Tabs */}
      <ProfileHeader controller={controller} />

      {/* Nội dung theo Tab */}
      {controller.activeTab === "overview" && (
        <ProfileOverviewSection controller={controller} />
      )}
      {controller.activeTab === "about" && (
        <ProfileAboutSection controller={controller} />
      )}
      {controller.activeTab === "friends" && (
        <ProfileFriendsSection controller={controller} />
      )}
      {controller.activeTab === "activity" && (
        <ProfileActivitySection controller={controller} />
      )}

      {/* Modal Chỉnh sửa Hồ sơ cá nhân & Các Modal Tương tác Bài viết */}
      <ProfileEditModal controller={controller} />
      <PostDetailModal controller={controller} />
      <PostReactionsModal controller={controller} />
      <MediaLightboxModal controller={controller} />

      {controller.unfriendTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận hủy kết bạn"
            onClick={controller.handleCancelUnfriend}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Hủy kết bạn với {controller.unfriendTarget.fullName}?
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Bạn có chắc chắn muốn xóa{" "}
                    <strong className="text-foreground">
                      {controller.unfriendTarget.fullName}
                    </strong>{" "}
                    khỏi danh sách bạn bè? Bạn vẫn có thể gửi lại lời mời kết
                    bạn sau này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={controller.handleCancelUnfriend}
                  aria-label="Đóng hộp thoại xác nhận"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground cursor-pointer"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={controller.handleCancelUnfriend}
                  disabled={controller.isUnfriending}
                >
                  Giữ kết nối
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  isLoading={controller.isUnfriending}
                  onClick={() => void controller.handleConfirmUnfriend()}
                >
                  Xác nhận hủy kết bạn
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ProfileView;
