import React from 'react';
import { AppImage, LoadingSpinner } from '@/core';
import { getClientProfilePath } from '@/routes/paths';
import { Link } from 'react-router-dom';
import { UsersIcon } from '../home/ClientIcons';
import { useSearchController, type SearchResultTab } from './search.controller';

const tabs: Array<{ id: SearchResultTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'people', label: 'Mọi người' },
  { id: 'posts', label: 'Bài viết' },
  { id: 'pages', label: 'Trang' },
];

export default function SearchResultsView(): React.ReactElement {
  const controller = useSearchController();
  const showPeople = controller.activeTab === 'all' || controller.activeTab === 'people';
  const showPosts = controller.activeTab === 'all' || controller.activeTab === 'posts';

  if (controller.query.length < 2) {
    return <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">Nhập ít nhất 2 ký tự để tìm kiếm trên Lyora.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm text-muted">Kết quả tìm kiếm cho</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{controller.query}</h1>
        <nav aria-label="Loại kết quả" className="mt-5 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => controller.handleSelectTab(tab.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer ${controller.activeTab === tab.id ? 'bg-secondary text-primary' : 'text-muted hover:bg-background hover:text-foreground'}`}>{tab.label}</button>)}
        </nav>
      </header>

      {controller.activeTab === 'pages' ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><UsersIcon className="mx-auto h-7 w-7 text-muted" /><h2 className="mt-3 font-semibold text-foreground">Trang sẽ sớm có mặt</h2><p className="mt-1 text-sm text-muted">Lyora chưa có hệ thống Trang và Theo dõi trang để tìm kiếm.</p></section>
      ) : <>
        {showPeople && <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Mọi người</h2>{controller.isLoadingPeople ? <div className="flex h-24 items-center justify-center"><LoadingSpinner size="md" /></div> : controller.people.length === 0 ? <p className="mt-4 text-sm text-muted">Không tìm thấy người dùng phù hợp.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{controller.people.map((person) => <Link key={person.id} to={getClientProfilePath(person.id)} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 hover:bg-background"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-secondary font-bold text-primary-active">{person.avatarUrl ? <AppImage src={person.avatarUrl} alt={person.fullName} rounded className="h-11 w-11" /> : person.fullName.charAt(0)}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{person.fullName}</span><span className="block truncate text-xs text-muted">{person.workplace || person.location || 'Thành viên Lyora'}</span></span></Link>)}</div>}</section>}
        {showPosts && <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Bài viết</h2>{controller.isLoadingPosts ? <div className="flex h-24 items-center justify-center"><LoadingSpinner size="md" /></div> : controller.posts.length === 0 ? <p className="mt-4 text-sm text-muted">Không tìm thấy bài viết phù hợp.</p> : <div className="mt-4 space-y-3">{controller.posts.map((post) => <article key={post.id} className="rounded-xl border border-border bg-background/40 p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active">{post.author.fullName.charAt(0)}</span><Link to={getClientProfilePath(post.author.id)} className="text-sm font-semibold text-foreground hover:underline">{post.author.fullName}</Link></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{post.content}</p></article>)}</div>}</section>}
      </>}
    </div>
  );
}
