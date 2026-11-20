import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, LoadingSpinner, useAuthStore } from '@/core';
import type { FriendUser } from '@/features/conversations';
import {
  CheckIcon,
  CloseIcon,
  SearchIcon,
  UsersIcon,
} from './ConversationIcons';

interface NewGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendUser[];
  isLoadingFriends: boolean;
  isCreating: boolean;
  onSubmit: (title: string, memberIds: string[], idempotencyKey: string) => Promise<void> | void;
}

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const NewGroupChatModal: React.FC<NewGroupChatModalProps> = ({
  isOpen,
  onClose,
  friends,
  isLoadingFriends,
  isCreating,
  onSubmit,
}) => {
  const currentUser = useAuthStore((state) => state.user);

  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Sinh key mới mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [isOpen]);

  // Sinh key mới khi người dùng thay đổi payload (title hoặc members)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setErrorMsg(null);
    setIdempotencyKey(crypto.randomUUID());
  };

  const filteredFriends = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return friends;
    const normalizedTerm = removeVietnameseDiacritics(term);

    return friends.filter((f) => {
      const name = f.fullName.toLowerCase();
      const normalizedName = removeVietnameseDiacritics(name);
      return name.includes(term) || normalizedName.includes(normalizedTerm);
    });
  }, [friends, search]);

  const selectedFriends = useMemo(() => {
    const set = new Set(selectedFriendIds);
    return friends.filter((f) => set.has(f.id));
  }, [friends, selectedFriendIds]);

  const toggleFriend = (id: string) => {
    setErrorMsg(null);
    setIdempotencyKey(crypto.randomUUID());
    setSelectedFriendIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 99) {
        setErrorMsg('Hội thoại nhóm tối đa 99 người bạn');
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeFriend = (id: string) => {
    setErrorMsg(null);
    setIdempotencyKey(crypto.randomUUID());
    setSelectedFriendIds((prev) => prev.filter((item) => item !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      setErrorMsg('Tên nhóm phải có độ dài từ 2 đến 100 ký tự');
      return;
    }

    if (selectedFriendIds.length < 2) {
      setErrorMsg(
        'Hội thoại nhóm cần tối thiểu 2 người bạn (tổng 3 thành viên bao gồm bạn)',
      );
      return;
    }

    if (selectedFriendIds.length > 99) {
      setErrorMsg('Hội thoại nhóm không được vượt quá 99 người bạn');
      return;
    }

    try {
      setErrorMsg(null);
      await onSubmit(trimmedTitle, selectedFriendIds, idempotencyKey);
      // Kết thúc lifecycle của key khi tạo thành công
      handleResetAndClose();
    } catch (err: unknown) {
      // Khi API lỗi, giữ nguyên title, selectedFriendIds và idempotencyKey để retry
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.');
      }
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setSearch('');
    setSelectedFriendIds([]);
    setErrorMsg(null);
    setIdempotencyKey('');
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = selectedFriendIds.length;
  const totalCount = selectedCount + 1; // Bao gồm người tạo
  const isFormValid =
    title.trim().length >= 2 &&
    title.trim().length <= 100 &&
    selectedCount >= 2 &&
    selectedCount <= 99;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col max-h-[90vh]">
        {/* 1. Header & Bare Outline Icon */}
        <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <UsersIcon className="h-5 w-5 text-primary shrink-0" />
            <h3
              id="group-chat-modal-title"
              className="text-lg font-bold text-foreground"
            >
              Tạo nhóm trò chuyện
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Đóng modal"
            className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1"
        >
          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg bg-error/10 border border-error/30 p-3 text-xs text-error font-medium"
            >
              {errorMsg}
            </div>
          )}

          {/* 2. Group Avatar Preview & Title Input */}
          <div className="flex items-start gap-3">
            {/* Avatar nhóm mặc định */}
            <div
              className="w-12 h-12 rounded-full bg-secondary border border-secondary-strong/40 flex items-center justify-center text-primary shrink-0 font-bold"
              title="Ảnh đại diện nhóm mặc định"
            >
              <UsersIcon className="w-6 h-6 stroke-[1.8]" />
            </div>

            {/* Ô nhập tên nhóm & Bộ đếm ký tự */}
            <div className="flex-1">
              <label
                htmlFor="group-title-input"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                Tên nhóm <span className="text-error">*</span>
              </label>
              <Input
                id="group-title-input"
                value={title}
                onChange={handleTitleChange}
                placeholder="Đặt tên nhóm trò chuyện..."
                maxLength={100}
                required
                className="w-full text-sm"
                autoFocus
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-muted">
                  Độ dài từ 2 đến 100 ký tự
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    title.length > 100 ? 'text-error font-bold' : 'text-muted'
                  }`}
                >
                  {title.length} / 100 ký tự
                </span>
              </div>
            </div>
          </div>

          {/* 3. Khu vực thành viên: Người tạo nhóm (Chủ nhóm) */}
          <div className="border border-border/80 rounded-xl p-3 bg-background/50">
            <span className="text-xs font-semibold text-muted block mb-2">
              Chủ nhóm (Người tạo)
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {currentUser?.fullName?.charAt(0) ?? 'B'}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {currentUser?.fullName ?? 'Bạn'}
                </span>
              </div>
              <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-primary/20">
                Chủ nhóm
              </span>
            </div>
          </div>

          {/* 4. Selected Member Chips */}
          {selectedFriends.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-muted block mb-1.5">
                Bạn bè đã chọn ({selectedFriends.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-background/30 rounded-lg border border-border">
                {selectedFriends.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 bg-secondary text-primary-active text-xs font-medium px-2.5 py-1 rounded-full border border-secondary-strong/40"
                  >
                    <span>{f.fullName}</span>
                    <button
                      type="button"
                      onClick={() => removeFriend(f.id)}
                      aria-label={`Bỏ chọn ${f.fullName}`}
                      className="hover:text-error cursor-pointer rounded-full p-0.5"
                    >
                      <CloseIcon className="w-3 h-3 stroke-2" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. Thanh tìm kiếm bạn bè */}
          <div>
            <label
              htmlFor="friend-search-input"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Chọn bạn bè tham gia nhóm
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <Input
                id="friend-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bạn bè theo tên (hỗ trợ có dấu và không dấu)..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* 6. Danh sách bạn bè có checkbox & Independent Scroll */}
          <div className="border border-border rounded-xl p-1 bg-background/20 max-h-56 overflow-y-auto">
            {isLoadingFriends ? (
              <div className="flex flex-col items-center justify-center p-6 text-muted text-xs gap-2">
                <LoadingSpinner size="sm" />
                <span>Đang tải danh sách bạn bè...</span>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                {search.trim()
                  ? 'Không tìm thấy người bạn nào phù hợp với từ khóa'
                  : 'Danh sách bạn bè trống'}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`flex items-center justify-between p-2.5 hover:bg-background/80 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-secondary/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-secondary text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {friend.fullName.charAt(0)}
                          </div>
                          {friend.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-1 ring-card" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">
                          {friend.fullName}
                        </span>
                      </div>

                      {/* Custom Checkbox - Touch target 44px */}
                      <button
                        type="button"
                        aria-checked={isSelected}
                        role="checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFriend(friend.id);
                        }}
                        className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-on-primary'
                              : 'border-border bg-card hover:border-primary/60'
                          }`}
                        >
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-2" />}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Footer: Bộ đếm trạng thái & Nút hành động */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-muted font-medium">
              Đã chọn{' '}
              <strong className="text-foreground">{selectedCount}</strong> người
              bạn · Tổng cộng{' '}
              <strong className="text-primary">{totalCount}</strong> thành viên
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetAndClose}
                disabled={isCreating}
                className="min-h-[44px] px-4 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !isFormValid}
                isLoading={isCreating}
                className="min-h-[44px] px-5 text-xs font-bold"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
