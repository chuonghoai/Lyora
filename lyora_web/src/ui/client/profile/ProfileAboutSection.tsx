import React from 'react';
import { Button, formatDate } from '@/core';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarIcon,
  EditIcon,
  HomePinIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileAboutSectionProps {
  controller: ProfileController;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  controller,
}) => {
  const profile = controller.profile;
  if (!profile) return null;

  return (
    <section
      aria-label="Thông tin giới thiệu chi tiết"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Thông tin chi tiết
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            {controller.isOwnProfile
              ? 'Quản lý thông tin hiển thị và phương thức liên hệ cá nhân trên Lyora.'
              : `Thông tin giới thiệu công khai của ${profile.fullName}.`}
          </p>
        </div>

        {controller.isOwnProfile && (
          <Button
            type="button"
            variant="secondary"
            onClick={controller.handleOpenEditModal}
            className="gap-1.5"
          >
            <EditIcon className="w-4 h-4" />
            <span>Chỉnh sửa thông tin</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối 1: Tiểu sử, Công việc & Nơi sống */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Tổng quan & Công việc
          </h3>

          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div>
              <p className="text-xs text-muted">Giới thiệu bản thân</p>
              <p className="mt-1 text-sm text-foreground leading-relaxed">
                {profile.bio?.trim() || 'Chưa cập nhật lời giới thiệu.'}
              </p>
            </div>

            <div className="pt-3 border-t border-border space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <BriefcaseIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Công việc</p>
                  <p className="font-medium text-foreground">
                    {profile.workplace || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AcademicCapIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Học vấn</p>
                  <p className="font-medium text-foreground">
                    {profile.education || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Khu vực hiện tại</p>
                  <p className="font-medium text-foreground">
                    {profile.location || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HomePinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Quê quán</p>
                  <p className="font-medium text-foreground">
                    {profile.hometown || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 2: Liên hệ & Quyền riêng tư */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Liên hệ & Tài khoản
          </h3>

          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3 text-sm">
            {controller.isOwnProfile ? (
              <>
                <div className="flex items-start gap-3">
                  <MailIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Email tài khoản (Riêng tư)</p>
                    <p className="font-medium text-foreground break-all">
                      {profile.email || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted">Số điện thoại (Riêng tư)</p>
                    <p className="font-medium text-foreground tabular-nums">
                      {profile.phoneNumber || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted leading-relaxed">
                Email và số điện thoại cá nhân được ẩn để bảo vệ quyền riêng tư của thành viên.
              </div>
            )}

            <div className="flex items-start gap-3">
              <LinkIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted">Liên kết cá nhân</p>
                {profile.website ? (
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p className="font-medium text-foreground">Chưa cập nhật</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span>Tham gia từ {formatDate(profile.createdAt)}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>{profile.isActive ? 'Đang hoạt động' : 'Tạm khóa'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
