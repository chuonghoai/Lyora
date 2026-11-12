import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { useLoginController } from './login.controller';
import { CORE_CONSTANTS } from '@/core';
import lockupSvg from '@/core/assets/web_icon_lockup.svg';
import { ROUTES } from '@/routes/paths';

/**
 * Design Read: "Cyber Precision & Ambient Clarity: Giao diện đăng nhập tập trung,
 * thẻ thông tin sắc nét trên nền sáng tinh gọn, điểm xuyết ánh xanh Primary Blue #2563eb và biểu tượng thương hiệu."
 *
 * The Three Dials:
 * - DESIGN_VARIANCE: 2 (Chuẩn mực, tập trung vào tính an toàn và tiện dụng)
 * - MOTION_INTENSITY: 2 (Chuyển động vi mô mượt mà tại nút bấm, input focus và loading spinner)
 * - VISUAL_DENSITY: 2 (Khoảng cách thông thoáng, padding thoải mái, dễ đọc)
 */
export default function LoginView(): React.ReactElement {
  const controller = useLoginController();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to={ROUTES.CLIENT.ROOT}
          className="inline-block transition-transform duration-150 hover:scale-[1.02] focus:outline-none"
          aria-label="Về trang chủ Lyora"
        >
          <img
            src={lockupSvg}
            alt="Lyora Platform Logo"
            className="h-12 mx-auto object-contain"
          />
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0f172a]">
          Đăng nhập vào Lyora
        </h1>
        <p className="mt-1.5 text-sm text-[#475569]">
          Hệ sinh thái Cyber Keys & Giải pháp Phần mềm bản quyền
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-[#cbd5e1] shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
          <LoginForm controller={controller} />

          <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center text-xs text-[#64748b] space-y-2">
            <p>
              Chưa có tài khoản?{' '}
              <span className="text-[#2563eb] font-medium cursor-pointer hover:underline">
                Đăng ký tài khoản mới
              </span>
            </p>
            <p>
              Hỗ trợ kỹ thuật 24/7:{' '}
              <a
                href={`tel:${CORE_CONSTANTS.SUPPORT_PHONE}`}
                className="font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors"
              >
                {CORE_CONSTANTS.SUPPORT_PHONE}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to={ROUTES.CLIENT.ROOT}
            className="text-xs font-medium text-[#64748b] hover:text-[#0f172a] transition-colors inline-flex items-center gap-1.5"
          >
            ← Quay lại Cổng Khách Hàng
          </Link>
        </div>
      </div>
    </div>
  );
}

export { LoginView };
