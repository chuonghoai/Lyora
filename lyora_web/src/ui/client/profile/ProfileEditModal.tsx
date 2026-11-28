import React from 'react';
import { createPortal } from 'react-dom';
import { AppImage, Button, Input } from '@/core';
import { CameraIcon, CloseIcon } from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileEditModalProps {
  controller: ProfileController;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  controller,
}) => {
  if (!controller.isEditModalOpen || typeof document === 'undefined') {
    return null;
  }

  const displayName = controller.editForm.fullName.trim() || 'Thành viên Lyora';
  const initials = displayName.charAt(0).toUpperCase();
  const bioLength = controller.editForm.bio.length;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa hồ sơ cá nhân"
      onClick={controller.handleCloseEditModal}
      className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Chỉnh sửa hồ sơ cá nhân</h2>
            <p className="text-xs text-muted">
              Cập nhật ảnh hiển thị và thông tin giới thiệu của bạn trên Lyora.
            </p>
          </div>
          <button
            type="button"
            onClick={controller.handleCloseEditModal}
            aria-label="Đóng cửa sổ chỉnh sửa hồ sơ"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <form
          onSubmit={(e) => void controller.handleSaveProfile(e)}
          className="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
            {controller.editErrors._form && (
              <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
                {controller.editErrors._form}
              </p>
            )}

            {/* Khu vực Ảnh đại diện & Ảnh bìa */}
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {controller.editForm.avatarUrl ? (
                    <AppImage
                      src={controller.editForm.avatarUrl}
                      alt={displayName}
                      rounded
                      className="h-16 w-16 border border-border"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-xl font-bold text-primary-active border border-border">
                      {initials}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ảnh đại diện</p>
                    <p className="text-xs text-muted">Định dạng JPG, PNG, WEBP (tối đa 5MB).</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer">
                    <CameraIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Chọn ảnh mới</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void controller.handlePickAvatarFile(e)}
                      className="sr-only"
                    />
                  </label>
                  {controller.editForm.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={controller.handleRemoveAvatar}
                      className="h-8 px-2.5 py-1 text-xs text-error"
                    >
                      Gỡ ảnh
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Ảnh bìa hồ sơ</p>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer">
                      <CameraIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Tải ảnh bìa từ máy</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void controller.handlePickCoverFile(e)}
                        className="sr-only"
                      />
                    </label>
                    {controller.editForm.coverUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={controller.handleRemoveCover}
                        className="h-8 px-2.5 py-1 text-xs text-error"
                      >
                        Gỡ ảnh bìa
                      </Button>
                    )}
                  </div>
                </div>

                {controller.editForm.coverUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border h-28 bg-secondary">
                    <AppImage
                      src={controller.editForm.coverUrl}
                      alt="Xem trước ảnh bìa"
                      className="h-full w-full rounded-none object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    Chưa có ảnh bìa. Hãy tải ảnh lên hoặc để nền mặc định.
                  </p>
                )}
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Họ và tên"
                name="fullName"
                value={controller.editForm.fullName}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.fullName}
                placeholder="Nhập họ và tên hiển thị"
                required
              />

              <Input
                label="Số điện thoại"
                name="phoneNumber"
                value={controller.editForm.phoneNumber}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.phoneNumber}
                placeholder="Ví dụ: 0908123456"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-edit-bio"
                  className="text-sm font-medium text-foreground"
                >
                  Giới thiệu bản thân
                </label>
                <span className="text-xs text-muted tabular-nums">{bioLength}/300</span>
              </div>
              <textarea
                id="profile-edit-bio"
                name="bio"
                rows={3}
                maxLength={300}
                value={controller.editForm.bio}
                onChange={controller.handleEditFormChange}
                placeholder="Chia sẻ ngắn gọn về bản thân, sở thích hoặc điều bạn quan tâm..."
                className={`w-full resize-y rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 transition-colors ${
                  controller.editErrors.bio
                    ? 'border-error focus:border-error focus:ring-error/25'
                    : 'border-border focus:border-primary focus:ring-primary/40'
                }`}
              />
              {controller.editErrors.bio && (
                <span role="alert" className="text-xs text-error">
                  {controller.editErrors.bio}
                </span>
              )}
            </div>

            {/* Thông tin mở rộng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Khu vực hiện tại"
                name="location"
                value={controller.editForm.location}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.location}
                placeholder="Ví dụ: TP. Hồ Chí Minh"
              />

              <Input
                label="Quê quán"
                name="hometown"
                value={controller.editForm.hometown}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.hometown}
                placeholder="Ví dụ: Đà Lạt, Lâm Đồng"
              />

              <Input
                label="Công việc / Vai trò"
                name="workplace"
                value={controller.editForm.workplace}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.workplace}
                placeholder="Ví dụ: Kỹ sư phần mềm tại Lyora"
              />

              <Input
                label="Học vấn"
                name="education"
                value={controller.editForm.education}
                onChange={controller.handleEditFormChange}
                error={controller.editErrors.education}
                placeholder="Ví dụ: Đại học Bách Khoa"
              />
            </div>

            <Input
              label="Liên kết cá nhân"
              name="website"
              value={controller.editForm.website}
              onChange={controller.handleEditFormChange}
              error={controller.editErrors.website}
              placeholder="Ví dụ: https://lyora.vn"
            />
          </div>

          <footer className="shrink-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-background/50">
            <Button
              type="button"
              variant="outline"
              onClick={controller.handleCloseEditModal}
              disabled={controller.isSavingProfile}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={controller.isSavingProfile}
            >
              Lưu thay đổi
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
};
