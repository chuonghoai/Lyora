import React from 'react';
import EmojiPicker, { Categories } from 'emoji-picker-react';

export interface ChatEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const PICKER_CATEGORIES = [
  { category: Categories.SUGGESTED, name: 'Dùng gần đây' },
  { category: Categories.SMILEYS_PEOPLE, name: 'Mặt cười & Con người' },
  { category: Categories.ANIMALS_NATURE, name: 'Động vật & Thiên nhiên' },
  { category: Categories.FOOD_DRINK, name: 'Đồ ăn & Thức uống' },
  { category: Categories.TRAVEL_PLACES, name: 'Du lịch & Địa điểm' },
  { category: Categories.ACTIVITIES, name: 'Hoạt động' },
  { category: Categories.OBJECTS, name: 'Đồ vật' },
  { category: Categories.SYMBOLS, name: 'Biểu tượng' },
  { category: Categories.FLAGS, name: 'Cờ' },
];

// Bảng chọn emoji từ thư viện, dữ liệu tiếng Việt tải tách chunk
const ChatEmojiPicker: React.FC<ChatEmojiPickerProps> = ({ onSelect }) => (
  <EmojiPicker
    onEmojiClick={(data) => onSelect(data.emoji)}
    emojiData={() => import('emoji-picker-react/data/emojis-vi')}
    categories={PICKER_CATEGORIES}
    theme="light"
    width="100%"
    height={300}
    lazyLoadEmojis
    skinTonesDisabled
    previewConfig={{ showPreview: false }}
    labels={{
      searchPlaceholder: 'Tìm biểu tượng cảm xúc',
      searchLabel: 'Tìm biểu tượng cảm xúc',
      searchClear: 'Xóa tìm kiếm',
      searchResultsNone: 'Không tìm thấy biểu tượng phù hợp',
      categoryNavigation: 'Danh mục biểu tượng',
      loading: 'Đang tải biểu tượng...',
      loadingError: 'Không thể tải biểu tượng',
      retryLoading: 'Thử lại',
    }}
    className="rounded-xl border-border [--epr-bg-color:var(--color-card)] [--epr-category-label-bg-color:var(--color-card)] [--epr-text-color:var(--color-foreground)] [--epr-highlight-color:var(--color-primary)] [--epr-hover-bg-color:var(--color-secondary)] [--epr-focus-bg-color:var(--color-secondary)] [--epr-picker-border-color:var(--color-border)] [--epr-search-border-color:var(--color-border)] [--epr-search-border-color-active:var(--color-primary)] [--epr-search-input-bg-color:var(--color-background)] [--epr-search-input-bg-color-active:var(--color-card)] [--epr-category-icon-active-color:var(--color-primary)]"
  />
);

export default ChatEmojiPicker;
