import React, { useEffect, useState } from 'react';
import { AppImage, Button, EmptyState } from '@/core';
import type { ConversationMember } from '@/features/conversations';
import {
  CheckIcon,
  CloseIcon,
  CrownIcon,
  UsersIcon,
} from './ConversationIcons';

export interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentUserId?: string;
  initialSelectedUserId?: string | null;
  isTransferring: boolean;
  onSubmit: (newOwnerId: string) => Promise<void> | void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  initialSelectedUserId = null,
  isTransferring,
  onSubmit,
}) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(
    initialSelectedUserId,
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedOwnerId(null);
      return;
    }
    setSelectedOwnerId(initialSelectedUserId ?? null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isTransferring) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, initialSelectedUserId, isTransferring, onClose]);

  if (!isOpen) return null;

  const eligibleMembers = members.filter((m) => m.userId !== currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) return;

    try {
      await onSubmit(selectedOwnerId);
      setSelectedOwnerId(null);
      onClose();
    } catch {
      // Handled by controller
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-ownership-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isTransferring) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <CrownIcon className="h-4.5 w-4.5" />
            </div>
            <h3
              id="transfer-ownership-title"
              className="text-base font-bold text-foreground"
            >
              Chuyển quyền Trưởng nhóm
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isTransferring) onClose();
            }}
            disabled={isTransferring}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border">
            <div className="p-3 text-xs text-warning bg-warning/10 border border-warning/30 rounded-xl">
              <strong>Lưu ý quan trọng:</strong> Sau khi chuyển quyền, bạn sẽ trở
              thành thành viên thông thường. Bạn sẽ không thể tự lấy lại quyền
              Trưởng nhóm trừ khi được Trưởng nhóm mới chỉ định lại.
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-1">
            {eligibleMembers.length === 0 ? (
              <EmptyState
                compact
                icon={<UsersIcon className="w-5 h-5" />}
                title="Không có thành viên khác trong nhóm"
                description="Nhóm cần ít nhất một thành viên khác để chuyển quyền Trưởng nhóm."
              />
            ) : (
              eligibleMembers.map((member) => {
                const isSelected = selectedOwnerId === member.userId;
                const initial = (member.user?.fullName || 'U')
                  .charAt(0)
                  .toUpperCase();

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedOwnerId(member.userId)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/10 border border-primary/30'
                        : 'hover:bg-background/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {member.user?.avatarUrl ? (
                          <AppImage
                            src={member.user.avatarUrl}
                            alt={member.user.fullName}
                            rounded
                            className="w-9 h-9 border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary text-primary font-bold text-xs flex items-center justify-center border border-border">
                            {initial}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {member.user?.fullName}
                        </p>
                        <span className="text-xs text-muted">Thành viên</span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-on-primary'
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
              disabled={isTransferring}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedOwnerId || isTransferring}
              isLoading={isTransferring}
            >
              Xác nhận chuyển quyền
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
