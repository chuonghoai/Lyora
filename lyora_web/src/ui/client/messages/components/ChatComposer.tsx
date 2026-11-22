import React, { useEffect, useRef } from 'react';
import { PaperclipIcon, SendIcon } from './ConversationIcons';

interface ChatComposerProps {
  text: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  text,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendDisabled = disabled || !text.trim();

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
    onChange(e.target.value);
  };

  return (
    <footer className="border-t border-border bg-card p-3 sm:p-4 shrink-0">
      <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
        {/* Nút đính kèm tệp (Disabled trong bản demo) */}
        <button
          type="button"
          disabled
          aria-label="Đính kèm tệp (Chưa khả dụng trong bản demo)"
          title="Đính kèm tệp (Chưa khả dụng trong bản demo)"
          className="group min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-xl text-muted/40 cursor-not-allowed border border-border/40 bg-background"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>

        {/* Textarea nhập tin nhắn tự co giãn */}
        <div className="relative flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="Nhập tin nhắn..."
            aria-label="Nội dung tin nhắn"
            className="min-h-[44px] max-h-[120px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition-colors block"
          />
        </div>

        {/* Nút gửi tin nhắn demo */}
        <button
          type="button"
          onClick={onSend}
          disabled={isSendDisabled}
          aria-label="Gửi tin nhắn"
          className={`group min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-xl transition-all ${
            isSendDisabled
              ? 'text-muted/40 cursor-not-allowed bg-background border border-border/40'
              : 'text-primary hover:text-primary-hover bg-secondary/80 hover:bg-secondary cursor-pointer border border-secondary-strong/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95'
          }`}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
};
