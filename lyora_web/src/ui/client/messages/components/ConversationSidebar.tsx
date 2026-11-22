import React from 'react';
import type {
  ConversationSummary,
  ConversationType,
} from '@/features/conversations';
import { PlusIcon, SearchIcon, UserIcon, UsersIcon } from './ConversationIcons';
import { ConversationListItem } from './ConversationListItem';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  filterType: 'ALL' | ConversationType;
  onFilterChange: (type: 'ALL' | ConversationType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenDirectModal: () => void;
  onOpenGroupModal: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  filterType,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenDirectModal,
  onOpenGroupModal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card md:w-80 shrink-0">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Tin nhắn
        </h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Tạo cuộc hội thoại mới"
            aria-expanded={isMenuOpen}
            className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <PlusIcon className="h-6 w-6" />
          </button>

          {/* New Chat Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-30 w-48 rounded-xl border border-border bg-card p-1.5 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenDirectModal();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Tin nhắn 1-1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenGroupModal();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <UsersIcon className="h-4 w-4" />
                  <span>Tạo nhóm chat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm hội thoại..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Filter Tabs */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange('ALL')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('DIRECT')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'DIRECT'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            Cá nhân
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('GROUP')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'GROUP'
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            Nhóm
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          // Skeletons
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl p-3 animate-pulse"
            >
              <div className="h-12 w-12 rounded-full bg-secondary/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-secondary/50" />
                <div className="h-3 w-1/2 rounded bg-secondary/40" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted">
            {searchQuery
              ? 'Không tìm thấy cuộc hội thoại nào phù hợp.'
              : 'Chưa có cuộc trò chuyện nào. Hãy tạo mới để bắt đầu kết nối!'}
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
};
