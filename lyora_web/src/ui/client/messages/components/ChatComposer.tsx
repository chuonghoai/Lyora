import React, { useEffect, useRef } from 'react';
import { PaperclipIcon, SendIcon } from './ConversationIcons';

interface ChatComposerProps {
  text?: string;
  onChange?: (text: string) => void;
  onSend?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  text = '',
  onChange,
  onKeyDown,
  disabled = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động điều chỉnh chiều cao textarea theo nội dung (tối đa 120px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <footer className="border-t border-border bg-card p-3 sm:p-4 shrink-0">
      <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
        {/* Nút đính kèm tệp (Chưa hỗ trợ) */}
        <button
          type="button"
          disabled
          aria-label="Đính kèm tệp (Tính năng đang phát triển)"
          title="Đính kèm tệp (Tính năng đang phát triển)"
          className="group min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-xl text-muted/40 cursor-not-allowed border border-border/40 bg-background"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>

        {/* Textarea nhập tin nhắn (Tính năng đang phát triển) */}
        <div className="relative flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="Tính năng gửi tin nhắn đang phát triển..."
            aria-label="Nội dung tin nhắn"
            className="min-h-[44px] max-h-[120px] w-full resize-none rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted cursor-not-allowed focus:outline-none leading-relaxed transition-colors block"
          />
        </div>

        {/* Nút gửi tin nhắn (Disabled, tính năng đang phát triển) */}
        <button
          type="button"
          disabled
          aria-label="Tính năng gửi tin nhắn đang phát triển"
          title="Tính năng gửi tin nhắn đang phát triển"
          className="group min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-xl text-muted/40 cursor-not-allowed bg-background border border-border/40"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
};
