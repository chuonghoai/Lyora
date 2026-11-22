import React, { useEffect, useState } from 'react';
import { Button, Input } from '@/core';
import { CloseIcon, PencilIcon } from './ConversationIcons';

export interface RenameGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  isUpdating: boolean;
  onSubmit: (newTitle: string) => Promise<void> | void;
}

export const RenameGroupModal: React.FC<RenameGroupModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  isUpdating,
  onSubmit,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setErrorMsg(null);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      setErrorMsg('Tên nhóm phải có độ dài từ 2 đến 100 ký tự');
      return;
    }
    if (trimmed === currentTitle.trim()) {
      onClose();
      return;
    }

    try {
      await onSubmit(trimmed);
      onClose();
    } catch {
      // Error handled by controller
    }
  };

  const isSaveDisabled =
    isUpdating ||
    title.trim().length < 2 ||
    title.trim().length > 100 ||
    title.trim() === currentTitle.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-group-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <PencilIcon className="h-4.5 w-4.5" />
            </div>
            <h3
              id="rename-group-title"
              className="text-base font-bold text-foreground"
            >
              Đổi tên nhóm
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs text-error bg-error/10 border border-error/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="rename-group-input"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Tên nhóm mới <span className="text-error">*</span>
            </label>
            <Input
              id="rename-group-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Nhập tên nhóm mới..."
              maxLength={100}
              autoFocus
              className="w-full text-sm"
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-muted">
              <span>Độ dài từ 2 đến 100 ký tự</span>
              <span>{title.length} / 100</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaveDisabled}
              isLoading={isUpdating}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
