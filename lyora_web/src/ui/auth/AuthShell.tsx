import React from 'react';
import { Link } from 'react-router-dom';
import webIconSymbol from '@/core/assets/web_icon_symbol.svg';
import { ROUTES } from '@/routes/paths';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  progress?: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  description,
  children,
  progress,
  footer,
}) => {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] lg:p-0">
      <section className="relative hidden overflow-hidden bg-[#0f172a] px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full border border-white/15" />
        <Link to={ROUTES.CLIENT.ROOT} className="relative inline-flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Về cổng khách hàng Lyora">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1.5 shadow-sm">
            <img src={webIconSymbol} alt="" className="h-full w-full" />
          </span>
          <span className="text-xl font-bold tracking-tight">Lyora</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight">Kết nối, chia sẻ và phát triển cùng cộng đồng.</p>
          <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">Một không gian an toàn để quản lý tài khoản và tiếp tục trải nghiệm Lyora.</p>
        </div>

        <p className="relative text-sm text-slate-400">Lyora Platform · Cộng đồng số dành cho bạn</p>
      </section>

      <section className="flex min-h-full items-center justify-center lg:px-12 xl:px-20">
        <div className="w-full max-w-[30rem]">
          <Link to={ROUTES.CLIENT.ROOT} className="mb-10 inline-flex items-center gap-3 rounded-2xl lg:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]" aria-label="Về cổng khách hàng Lyora">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5 shadow-sm border border-[#e5e4e7]">
              <img src={webIconSymbol} alt="" className="h-full w-full" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[#0f172a]">Lyora</span>
          </Link>

          <header>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{title}</h1>
            <p className="mt-2 text-base leading-6 text-[#475569]">{description}</p>
            {progress && <div className="mt-8">{progress}</div>}
          </header>

          <div className="mt-8 rounded-2xl border border-[#e5e4e7] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:p-8">
            {children}
          </div>

          <div className="mt-6 text-center text-sm text-[#475569]">{footer}</div>
          <div className="mt-7 text-center">
            <Link to={ROUTES.CLIENT.ROOT} className="text-sm font-medium text-[#64748b] underline-offset-4 hover:text-[#2563eb] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">← Về Cổng Khách Hàng</Link>
          </div>
        </div>
      </section>
    </main>
  );
};
