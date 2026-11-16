import React from 'react';

interface IconProps {
  className?: string;
  filled?: boolean;
}

export const HomeFeedIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19.5a7 7 0 0 1 14 0" />
  </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', filled = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-4-6.5 4V5.5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path strokeLinecap="round" d="m20 20-3.5-3.5" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0h6Z" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M3.5 9.5h17M3.5 14.5h17M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path strokeLinecap="round" d="M8 11V8a4 4 0 1 1 8 0v3" />
  </svg>
);

export const ThumbUpIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', filled = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 10v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm0 0 4.2-6.3a1.5 1.5 0 0 1 2.7.9V9h4.6a2 2 0 0 1 2 2.4l-1.2 6.5A2 2 0 0 1 17.3 19.5H7"
    />
  </svg>
);

export const CommentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
    />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M21 12H9a6 6 0 0 0-6 6v1" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-4.5-4.5L7 20" />
  </svg>
);

export const VideoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m17 10 4-2.5v9L17 14v-4Z" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 5.5v13l11-6.5L8 5.5Z" />
  </svg>
);

export const SendIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
  </svg>
);

export const MoreHorizontalIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="5.5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18.5" cy="12" r="1.5" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
    <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
  </svg>
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} className={className} aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 8.5h9m-9 4h6m6.5-.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-3.8-.9L3 21l1.4-4.2A8.4 8.4 0 0 1 3.5 12a8.5 8.5 0 1 1 17 0Z"
    />
  </svg>
);

export const MinusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
    <path strokeLinecap="round" d="M5 12h14" />
  </svg>
);

export const MoreVerticalIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="12" cy="5.5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18.5" r="1.5" />
  </svg>
);

export const MicIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path strokeLinecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3m-3 0h6" />
  </svg>
);

export const StickerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h6l8-8V7a4 4 0 0 0-4-4h-3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 21v-5a3 3 0 0 1 3-3h5" />
    <circle cx="9.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="9.5" r="1" fill="currentColor" />
  </svg>
);

export const GifIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 10.5H8a1.5 1.5 0 0 0-1.5 1.5v0A1.5 1.5 0 0 0 8 13.5h1.5v-1.2H8.4M12 10v4m3-4v4m0-4h2m-2 2h1.5" />
  </svg>
);

export const SmileIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M8.5 14.5a4 4 0 0 0 7 0" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M12 8v8M8 12h8" />
  </svg>
);

export const ReplyIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
);

export const PinIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 4 5 5-3.5 3.5L18 16l-5-5-4 4v3H6l-3-3v-3h3l4-4-5-5 3.5-1.5L15 4Z" />
  </svg>
);

export const ForwardIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 14 5-5-5-5M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
  </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5M4 9h10a6 6 0 1 1 0 12h-1" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

export const VideoCallIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden="true">
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m16 10 5-3v10l-5-3v-4Z" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
    />
  </svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.8.45-1.2 1-1.2 1.8v.5" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" />
  </svg>
);

export const AccessibilityIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} className={className} aria-hidden="true">
    <circle cx="12" cy="5.5" r="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5h14M12 9.5v4.5m0 0-3 6m3-6 3 6" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
);
