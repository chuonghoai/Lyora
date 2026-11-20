import React, { useMemo, useState } from 'react';
import type { FriendUser } from '@/features/conversations';
import { CloseIcon, SearchIcon } from './ConversationIcons';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendUser[];
  isLoadingFriends: boolean;
  isCreating: boolean;
  onSelectFriend: (friendId: string) => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({
  isOpen,
  onClose,
  friends,
  isLoadingFriends,
  isCreating,
  onSelectFriend,
}) => {
  const [search, setSearch] = useState('');

  const filteredFriends = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter((f) => f.fullName.toLowerCase().includes(term));
  }, [friends, search]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3
            id="direct-chat-modal-title"
            className="text-lg font-bold text-foreground"
          >
            Bắt đầu trò chuyện
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-1">
          {isLoadingFriends ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg p-2.5 animate-pulse"
              >
                <div className="h-10 w-10 rounded-full bg-secondary/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-1/2 rounded bg-secondary/50" />
                  <div className="h-3 w-1/3 rounded bg-secondary/40" />
                </div>
              </div>
            ))
          ) : filteredFriends.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">
              {search
                ? 'Không tìm thấy bạn bè nào phù hợp.'
                : 'Bạn chưa có người bạn nào trong danh sách.'}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const initial = (friend.fullName || 'F').charAt(0).toUpperCase();

              return (
                <button
                  key={friend.id}
                  type="button"
                  disabled={isCreating}
                  onClick={() => onSelectFriend(friend.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative shrink-0">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.fullName}
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold text-primary text-sm">
                        {initial}
                      </div>
                    )}
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {friend.fullName}
                    </p>
                    <span className="text-xs text-muted">
                      {friend.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </span>
                  </div>

                  <span className="text-xs text-primary font-semibold">
                    Nhắn tin
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
