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
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] lg:p-0">
      <section className="relative hidden overflow-hidden border-r border-border bg-secondary px-12 py-16 text-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-secondary-strong" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-secondary-strong/25" />
        <Link
          to={ROUTES.CLIENT.ROOT}
          className="relative inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          aria-label="Về cổng người dùng Lyora"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card p-1.5 shadow-sm">
            <img src={webIconSymbol} alt="" className="h-full w-full" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">Lyora</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Kết nối, chia sẻ và đồng hành cùng cộng đồng.
          </p>
          <p className="mt-6 max-w-sm text-base leading-7 text-muted">
            Không gian cộng đồng số để đăng bài viết, trò chuyện trực tiếp và giữ nhịp kết nối mỗi ngày.
          </p>
        </div>

        <p className="relative text-sm text-muted">Lyora Platform · Cộng đồng số dành cho bạn</p>
      </section>

      <section className="flex min-h-full items-center justify-center lg:px-12 xl:px-20">
        <div className="w-full max-w-[30rem]">
          <Link
            to={ROUTES.CLIENT.ROOT}
            className="mb-10 inline-flex items-center gap-3 rounded-xl lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            aria-label="Về cổng người dùng Lyora"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card p-1.5 shadow-sm">
              <img src={webIconSymbol} alt="" className="h-full w-full" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">Lyora</span>
          </Link>

          <header>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-base leading-6 text-muted">{description}</p>
            {progress && <div className="mt-8">{progress}</div>}
          </header>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </div>

          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
          <div className="mt-7 text-center">
            <Link
              to={ROUTES.CLIENT.ROOT}
              className="rounded-lg px-2 py-1 text-sm font-medium text-muted underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              ← Về Cổng Người Dùng
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
