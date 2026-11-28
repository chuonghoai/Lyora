import React, { useEffect, useState } from 'react';
import { AppImage, Button } from '@/core';
import type { ConversationMember } from '@/features/conversations';
import {
  CheckIcon,
  CloseIcon,
  CrownIcon,
  LogOutIcon,
} from './ConversationIcons';

export interface OwnerLeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentUserId?: string;
  isLeaving: boolean;
  onSubmit: (newOwnerId?: string) => Promise<void> | void;
}

export const OwnerLeaveGroupModal: React.FC<OwnerLeaveGroupModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  isLeaving,
  onSubmit,
}) => {
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSuccessorId(null);
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLeaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLeaving, onClose]);

  if (!isOpen) return null;

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const hasOtherMembers = otherMembers.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOtherMembers && !selectedSuccessorId) return;

    try {
      await onSubmit(selectedSuccessorId || undefined);
      setSelectedSuccessorId(null);
      onClose();
    } catch {
      // Handled by controller
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-leave-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isLeaving) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-error/10 text-error">
              <LogOutIcon className="h-4.5 w-4.5" />
            </div>
            <h3
              id="owner-leave-title"
              className="text-base font-bold text-foreground"
            >
              Rời khỏi nhóm trò chuyện
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isLeaving) onClose();
            }}
            disabled={isLeaving}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border">
            {hasOtherMembers ? (
              <div className="p-3 text-xs text-warning bg-warning/10 border border-warning/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CrownIcon className="w-3.5 h-3.5" />
                  <span>Yêu cầu chuyển quyền Trưởng nhóm</span>
                </div>
                <p>
                  Bạn hiện là Trưởng nhóm. Để rời khỏi nhóm, bạn bắt buộc phải
                  chỉ định một thành viên kế nhiệm làm Trưởng nhóm mới.
                </p>
              </div>
            ) : (
              <div className="p-3 text-xs text-error bg-error/10 border border-error/20 rounded-xl">
                Bạn là thành viên duy nhất còn lại trong nhóm. Nếu bạn rời nhóm,
                cuộc hội thoại nhóm này sẽ được <strong>tự động giải tán</strong>.
              </div>
            )}
          </div>

          {/* Other Members List if any */}
          {hasOtherMembers && (
            <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-1">
              <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted">
                Chọn người kế nhiệm Trưởng nhóm:
              </p>
              {otherMembers.map((member) => {
                const isSelected = selectedSuccessorId === member.userId;
                const initial = (member.user?.fullName || 'U')
                  .charAt(0)
                  .toUpperCase();

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedSuccessorId(member.userId)}
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
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLeaving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={(hasOtherMembers && !selectedSuccessorId) || isLeaving}
              isLoading={isLeaving}
            >
              {hasOtherMembers ? 'Chuyển quyền & Rời nhóm' : 'Rời & Giải tán nhóm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
