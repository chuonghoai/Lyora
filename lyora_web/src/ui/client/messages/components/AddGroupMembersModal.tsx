import React, { useMemo, useState } from 'react';
import { Button, Input, LoadingSpinner } from '@/core';
import type { FriendUser } from '@/features/conversations';
import {
  CheckIcon,
  CloseIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from './ConversationIcons';

export interface AddGroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendUser[];
  isLoadingFriends: boolean;
  existingMemberUserIds: string[];
  isAdding: boolean;
  onSubmit: (memberIds: string[]) => Promise<void> | void;
}

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const AddGroupMembersModal: React.FC<AddGroupMembersModalProps> = ({
  isOpen,
  onClose,
  friends,
  isLoadingFriends,
  existingMemberUserIds,
  isAdding,
  onSubmit,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingSet = useMemo(
    () => new Set(existingMemberUserIds),
    [existingMemberUserIds],
  );

  // Lọc chỉ lấy bạn bè chưa có trong nhóm
  const candidateFriends = useMemo(() => {
    return friends.filter((f) => !existingSet.has(f.id));
  }, [friends, existingSet]);

  const filteredFriends = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidateFriends;
    const normalizedTerm = removeVietnameseDiacritics(term);

    return candidateFriends.filter((f) => {
      const name = f.fullName.toLowerCase();
      const normalizedName = removeVietnameseDiacritics(name);
      return name.includes(term) || normalizedName.includes(normalizedTerm);
    });
  }, [candidateFriends, search]);

  if (!isOpen) return null;

  const toggleFriend = (id: string) => {
    setErrorMsg(null);
    setSelectedFriendIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (existingMemberUserIds.length + prev.length >= 100) {
        setErrorMsg('Hội thoại nhóm không được vượt quá 100 thành viên');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFriendIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một người bạn để thêm vào nhóm');
      return;
    }

    try {
      await onSubmit(selectedFriendIds);
      setSelectedFriendIds([]);
      onClose();
    } catch {
      // Error handled by controller
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-members-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlusIcon className="h-4.5 w-4.5" />
            </div>
            <h3
              id="add-members-title"
              className="text-base font-bold text-foreground"
            >
              Thêm thành viên vào nhóm
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border space-y-3">
            {errorMsg && (
              <div className="p-2.5 text-xs text-error bg-error/10 border border-error/20 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="pl-9 text-sm w-full"
                autoFocus
              />
              <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span>Đã chọn: {selectedFriendIds.length} người</span>
              <span>Tổng thành viên hiện tại: {existingMemberUserIds.length}</span>
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-1">
            {isLoadingFriends ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2 text-muted">
                <LoadingSpinner size="md" />
                <span className="text-xs">Đang tải danh sách bạn bè...</span>
              </div>
            ) : candidateFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
                <UsersIcon className="w-10 h-10 mb-2 opacity-40 text-muted" />
                <p className="text-sm font-medium text-foreground">
                  Không còn bạn bè nào để thêm
                </p>
                <p className="text-xs text-muted mt-1">
                  Tất cả bạn bè của bạn đã là thành viên trong nhóm này.
                </p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                Không tìm thấy bạn bè phù hợp với từ khóa &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriendIds.includes(friend.id);
                const initial = (friend.fullName || 'U').charAt(0).toUpperCase();

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-background/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary text-primary font-bold text-xs flex items-center justify-center border border-border">
                            {initial}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {friend.fullName}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-muted/40 bg-card'
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAdding}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={selectedFriendIds.length === 0 || isAdding}
              isLoading={isAdding}
            >
              Thêm ({selectedFriendIds.length})
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
