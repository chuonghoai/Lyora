import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppImage, formatRelativeTime, LoadingSpinner } from '@/core';
import { getReactionMeta, REACTION_OPTIONS } from '@/features/posts';
import type {
  ChatMessageItem,
  ChatWindowSession,
  FriendContactItem,
  HomeController,
} from './home.controller';
import {
  CloseIcon,
  ForwardIcon,
  GifIcon,
  ImageIcon,
  MicIcon,
  MinusIcon,
  MoreVerticalIcon,
  PhoneIcon,
  PinIcon,
  PlusCircleIcon,
  ReactionIcon,
  ReplyIcon,
  SendIcon,
  SmileIcon,
  StickerIcon,
  ThumbUpIcon,
  UndoIcon,
  VideoCallIcon,
} from './ClientIcons';

export interface FriendChatWidgetProps {
  controller: HomeController;
}

const ChatEmojiPicker = lazy(() => import('./ChatEmojiPicker'));

const QUICK_STICKERS = ['Xin chào!', 'Cà phê nhé!', 'Tuyệt vời!', 'Cảm ơn bạn!'] as const;
const QUICK_GIFS = ['[GIF] Vỗ tay nhiệt liệt', '[GIF] Hào hứng quá đi', '[GIF] Gửi ngàn trái tim', '[GIF] OK luôn bạn ơi'] as const;

interface FloatingPosition {
  left: number;
  top?: number;
  bottom?: number;
  openUpward: boolean;
  caretOffsetX: number;
}

function computeFloatingPosition(
  anchorRect: DOMRect,
  popupWidth: number,
  estimatedHeight: number,
  align: 'left-out' | 'right-out' | 'center',
): FloatingPosition {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const gap = 8;

  const openUpward = anchorRect.top >= estimatedHeight + gap + 8;

  let left: number;
  if (align === 'left-out') {
    left = anchorRect.left - 24;
  } else if (align === 'right-out') {
    left = anchorRect.right - popupWidth + 24;
  } else {
    left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;
  }

  left = Math.max(8, Math.min(left, viewportW - popupWidth - 8));
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const caretOffsetX = Math.max(14, Math.min(anchorCenterX - left, popupWidth - 14));

  if (openUpward) {
    return {
      left,
      bottom: viewportH - anchorRect.top + gap,
      openUpward: true,
      caretOffsetX,
    };
  }

  return {
    left,
    top: anchorRect.bottom + gap,
    openUpward: false,
    caretOffsetX,
  };
}

const FriendAvatar: React.FC<{
  name: string;
  avatarUrl?: string | null;
  sizeClass?: string;
  showOnline?: boolean;
}> = ({ name, avatarUrl, sizeClass = 'h-8 w-8 text-xs', showOnline = true }) => {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'B';

  return (
    <span className="relative inline-flex shrink-0">
      {avatarUrl ? (
        <AppImage
          src={avatarUrl}
          alt={name}
          rounded
          className={`${sizeClass} border border-border`}
        />
      ) : (
        <span
          className={`grid place-items-center rounded-full bg-secondary font-bold text-primary-active border border-border ${sizeClass}`}
        >
          {initials}
        </span>
      )}
      {showOnline && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card"
        />
      )}
    </span>
  );
};

const ChatMessageRow: React.FC<{
  friendId: string;
  msg: ChatMessageItem;
  friendName: string;
  friendAvatar?: string | null;
  isPinned: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  controller: HomeController;
}> = ({
  friendId,
  msg,
  friendName,
  friendAvatar,
  isPinned,
  scrollContainerRef,
  controller,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmoteOpen, setIsEmoteOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<FloatingPosition | null>(null);
  const [emotePos, setEmotePos] = useState<FloatingPosition | null>(null);

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const emoteTriggerRef = useRef<HTMLButtonElement>(null);
  const emotePortalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isMenuOpen || !menuTriggerRef.current) {
      setMenuPos(null);
      return;
    }
    const updatePosition = () => {
      if (!menuTriggerRef.current) return;
      const rect = menuTriggerRef.current.getBoundingClientRect();
      setMenuPos(
        computeFloatingPosition(
          rect,
          176,
          164,
          msg.isMine ? 'left-out' : 'right-out',
        ),
      );
    };
    updatePosition();

    const scrollEl = scrollContainerRef.current;
    const closeOnScroll = () => setIsMenuOpen(false);
    scrollEl?.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      scrollEl?.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isMenuOpen, msg.isMine, scrollContainerRef]);

  useLayoutEffect(() => {
    if (!isEmoteOpen || !emoteTriggerRef.current) {
      setEmotePos(null);
      return;
    }
    const updatePosition = () => {
      if (!emoteTriggerRef.current) return;
      const rect = emoteTriggerRef.current.getBoundingClientRect();
      setEmotePos(computeFloatingPosition(rect, 212, 44, 'center'));
    };
    updatePosition();

    const scrollEl = scrollContainerRef.current;
    const closeOnScroll = () => setIsEmoteOpen(false);
    scrollEl?.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      scrollEl?.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isEmoteOpen, scrollContainerRef]);

  useEffect(() => {
    if (!isMenuOpen && !isEmoteOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (isMenuOpen) {
        const insideTrigger = menuTriggerRef.current?.contains(target ?? null);
        const insidePortal = menuPortalRef.current?.contains(target ?? null);
        if (!insideTrigger && !insidePortal) {
          setIsMenuOpen(false);
        }
      }
      if (isEmoteOpen) {
        const insideTrigger = emoteTriggerRef.current?.contains(target ?? null);
        const insidePortal = emotePortalRef.current?.contains(target ?? null);
        if (!insideTrigger && !insidePortal) {
          setIsEmoteOpen(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsEmoteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, isEmoteOpen]);

  const actionsVisible = isMenuOpen || isEmoteOpen;

  const renderActionButtons = (order: 'mine' | 'friend') => {
    const moreBtn = (
      <button
        key="more"
        ref={menuTriggerRef}
        type="button"
        onClick={() => {
          setIsEmoteOpen(false);
          setIsMenuOpen((prev) => !prev);
        }}
        aria-expanded={isMenuOpen}
        aria-label="Tùy chọn tin nhắn"
        title="Tùy chọn tin nhắn"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
          isMenuOpen
            ? 'bg-secondary text-primary-active'
            : 'text-muted hover:bg-background hover:text-foreground'
        }`}
      >
        <MoreVerticalIcon className="w-3.5 h-3.5" />
      </button>
    );

    const replyBtn = (
      <button
        key="reply"
        type="button"
        onClick={() => {
          setIsMenuOpen(false);
          setIsEmoteOpen(false);
          controller.handleReplyMessage(friendId, msg);
        }}
        aria-label="Trả lời tin nhắn"
        title="Trả lời"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
      >
        <ReplyIcon className="w-3.5 h-3.5" />
      </button>
    );

    const emoteBtn = (
      <button
        key="emote"
        ref={emoteTriggerRef}
        type="button"
        onClick={() => {
          setIsMenuOpen(false);
          setIsEmoteOpen((prev) => !prev);
        }}
        aria-expanded={isEmoteOpen}
        aria-label="Thả cảm xúc"
        title="Thả cảm xúc"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
          isEmoteOpen
            ? 'bg-secondary text-primary-active'
            : 'text-muted hover:bg-background hover:text-foreground'
        }`}
      >
        <SmileIcon className="w-3.5 h-3.5" />
      </button>
    );

    const items =
      order === 'mine' ? [moreBtn, replyBtn, emoteBtn] : [emoteBtn, replyBtn, moreBtn];

    return (
      <div
        className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
          actionsVisible
            ? 'opacity-100'
            : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'
        }`}
      >
        {items}
      </div>
    );
  };

  return (
    <div
      className={`group flex items-end gap-2 ${msg.isMine ? 'justify-end' : 'justify-start'}`}
    >
      {!msg.isMine && (
        <button
          type="button"
          onClick={() => controller.handleOpenUserProfile(friendId)}
          aria-label={`Xem hồ sơ của ${friendName}`}
          className="shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <FriendAvatar
            name={friendName}
            avatarUrl={friendAvatar}
            sizeClass="h-6 w-6 text-[10px]"
            showOnline={false}
          />
        </button>
      )}

      {msg.isMine && !msg.isRecalled && renderActionButtons('mine')}

      <div className={`relative max-w-[70%] flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}>
        {msg.replyTo && !msg.isRecalled && (
          <div className="mb-1 rounded-xl border border-border bg-background/80 px-2.5 py-1 text-[11px] text-muted max-w-full">
            <span className="font-semibold text-foreground">{msg.replyTo.senderName}: </span>
            <span className="line-clamp-1">{msg.replyTo.text}</span>
          </div>
        )}

        {msg.forwardedFrom && !msg.isRecalled && (
          <span className="mb-0.5 px-1 text-[10px] italic text-muted">
            Đã chuyển tiếp từ {msg.forwardedFrom}
          </span>
        )}

        {msg.kind === 'LIKE' && !msg.isRecalled ? (
          <span
            title={formatRelativeTime(msg.createdAt)}
            role="img"
            aria-label={msg.text}
            className="px-1 text-primary"
          >
            <ThumbUpIcon className="w-8 h-8" filled />
          </span>
        ) : (
          <div
            title={formatRelativeTime(msg.createdAt)}
            className={
              msg.isRecalled
                ? 'rounded-2xl border border-dashed border-border bg-background/50 px-3 py-1.5 text-xs italic text-muted'
                : msg.isMine
                  ? 'rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-on-primary shadow-sm break-words'
                  : 'rounded-2xl rounded-bl-sm bg-background px-3.5 py-2 text-sm text-foreground break-words'
            }
          >
            {msg.mediaUrl && !msg.isRecalled && (
              <AppImage
                src={msg.mediaUrl}
                alt={msg.text}
                className="mb-1.5 max-h-36 w-full rounded-lg object-cover"
              />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {msg.reaction && !msg.isRecalled && (
          <button
            type="button"
            onClick={() => controller.handleReactChatMessage(friendId, msg.id, msg.reaction!)}
            title="Nhấn để gỡ cảm xúc"
            aria-label={`Gỡ cảm xúc ${getReactionMeta(msg.reaction).label}`}
            className={`-mt-2 relative z-10 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-border bg-card shadow-sm cursor-pointer ${
              msg.isMine ? 'mr-1' : 'ml-1'
            }`}
          >
            <ReactionIcon key={msg.reaction} type={msg.reaction} className="w-4.5 h-4.5 animate-emote-pop" />
          </button>
        )}
      </div>

      {!msg.isMine && !msg.isRecalled && renderActionButtons('friend')}

      {/* Portal Menu 3 chấm nổi ra ngoài phạm vi hộp chat */}
      {isMenuOpen &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuPortalRef}
            role="menu"
            style={{
              left: `${menuPos.left}px`,
              ...(menuPos.top !== undefined ? { top: `${menuPos.top}px` } : {}),
              ...(menuPos.bottom !== undefined ? { bottom: `${menuPos.bottom}px` } : {}),
            }}
            className="fixed z-50 w-44 rounded-xl border border-border bg-card p-1.5 shadow-md"
          >
            <span
              aria-hidden="true"
              style={{ left: `${menuPos.caretOffsetX}px` }}
              className={`absolute -translate-x-1/2 h-2.5 w-2.5 rotate-45 bg-card border-border ${
                menuPos.openUpward
                  ? '-bottom-1.5 border-r border-b'
                  : '-top-1.5 border-l border-t'
              }`}
            />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                controller.handleReplyMessage(friendId, msg);
              }}
              className="relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background cursor-pointer"
            >
              <ReplyIcon />
              <span>Trả lời tin nhắn</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                controller.handleTogglePinMessage(friendId, msg);
              }}
              className="relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background cursor-pointer"
            >
              <PinIcon />
              <span>{isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                controller.handleOpenForwardMessage(friendId, msg);
              }}
              className="relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background cursor-pointer"
            >
              <ForwardIcon />
              <span>Chuyển tiếp</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                controller.handleRecallMessage(friendId, msg.id);
              }}
              className="relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-error hover:bg-error/10 cursor-pointer"
            >
              <UndoIcon />
              <span>Thu hồi</span>
            </button>
          </div>,
          document.body,
        )}

      {/* Portal Thanh chọn Emotes nổi ra ngoài phạm vi hộp chat */}
      {isEmoteOpen &&
        emotePos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={emotePortalRef}
            role="toolbar"
            aria-label="Thả cảm xúc tin nhắn"
            style={{
              left: `${emotePos.left}px`,
              ...(emotePos.top !== undefined ? { top: `${emotePos.top}px` } : {}),
              ...(emotePos.bottom !== undefined ? { bottom: `${emotePos.bottom}px` } : {}),
            }}
            className="fixed z-50 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-md animate-emote-dock-in"
          >
            {REACTION_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                title={option.label}
                aria-label={option.label}
                onClick={() => {
                  setIsEmoteOpen(false);
                  controller.handleReactChatMessage(friendId, msg.id, option.type);
                }}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer ${
                  msg.reaction === option.type ? 'bg-secondary scale-110' : ''
                }`}
              >
                <ReactionIcon type={option.type} className="w-7 h-7" />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

const SingleChatWindow: React.FC<{
  win: ChatWindowSession;
  friend: FriendContactItem;
  isPrimaryOnMobile: boolean;
  controller: HomeController;
}> = ({ win, friend, isPrimaryOnMobile, controller }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const messages = controller.getMessagesForFriend(friend.id);
  const pinnedMessage = controller.getPinnedMessageForFriend(friend.id);
  const isTyping = win.draft.trim().length > 0;
  const isForwardingFromHere =
    controller.forwardingState?.sourceFriendId === friend.id;

  useEffect(() => {
    if (!win.isPlusMenuOpen && win.pickerTab === 'none') return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        win.isPlusMenuOpen &&
        plusMenuRef.current &&
        !plusMenuRef.current.contains(target ?? null)
      ) {
        controller.handleToggleChatPlusMenu(friend.id);
      }
      if (
        win.pickerTab !== 'none' &&
        pickerRef.current &&
        !pickerRef.current.contains(target ?? null)
      ) {
        controller.handleToggleChatPicker(friend.id, 'none');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [win.isPlusMenuOpen, win.pickerTab, friend.id, controller]);

  useEffect(() => {
    if (!win.isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [win.isMinimized, messages.length]);

  return (
    <section
      role="dialog"
      aria-label={`Trò chuyện với ${friend.fullName}`}
      className={`pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[310px] xl:w-[330px] h-[425px] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden ${
        isPrimaryOnMobile ? 'flex' : 'hidden sm:flex'
      }`}
    >
      {/* Header kiểu Messenger */}
      <header className="shrink-0 flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
        <button
          type="button"
          onClick={() => controller.handleOpenUserProfile(friend.id)}
          title={`Xem trang cá nhân của ${friend.fullName}`}
          className="group flex items-center gap-2.5 min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <FriendAvatar name={friend.fullName} avatarUrl={friend.avatarUrl} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
              {friend.fullName}
            </h3>
            <p className="text-[11px] text-success font-medium">Đang hoạt động</p>
          </div>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => controller.handleVoiceOrCallAction('audio-call')}
            aria-label="Gọi thoại"
            title="Gọi thoại"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <PhoneIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => controller.handleVoiceOrCallAction('video-call')}
            aria-label="Gọi video"
            title="Gọi video"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <VideoCallIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => controller.handleMinimizeChatWindow(friend.id)}
            aria-label="Thu gọn hộp nhắn tin"
            title="Thu gọn"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => controller.handleCloseChatWindow(friend.id)}
            aria-label="Đóng hộp nhắn tin"
            title="Đóng"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Banner Tin nhắn đã ghim */}
      {pinnedMessage && (
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <PinIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate text-foreground">
              <strong className="font-semibold">Đã ghim: </strong>
              {pinnedMessage.text}
            </span>
          </div>
          <button
            type="button"
            onClick={() => controller.handleUnpinCurrentMessage(friend.id)}
            aria-label="Bỏ ghim tin nhắn"
            className="text-muted hover:text-foreground shrink-0 cursor-pointer"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Nội dung tin nhắn */}
      <div
        ref={messagesScrollRef}
        className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-card"
      >
        {messages.map((msg) => (
          <ChatMessageRow
            key={msg.id}
            friendId={friend.id}
            msg={msg}
            friendName={friend.fullName}
            friendAvatar={friend.avatarUrl}
            isPinned={pinnedMessage?.id === msg.id}
            scrollContainerRef={messagesScrollRef}
            controller={controller}
          />
        ))}
        <div ref={messagesEndRef} />

        {/* Hộp chọn bạn bè để Chuyển tiếp tin nhắn */}
        {isForwardingFromHere && (
          <div className="sticky bottom-0 left-0 right-0 rounded-xl border border-border bg-card p-3 shadow-md space-y-2 z-20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Chuyển tiếp tin nhắn tới:</p>
              <button
                type="button"
                onClick={controller.handleCancelForward}
                aria-label="Hủy chuyển tiếp"
                className="text-muted hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {controller.friends.map((targetFriend) => (
                <button
                  key={targetFriend.id}
                  type="button"
                  onClick={() => controller.handleConfirmForwardToFriend(targetFriend.id)}
                  className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-background text-foreground cursor-pointer"
                >
                  <span className="truncate font-medium">{targetFriend.fullName}</span>
                  <span className="text-primary font-semibold shrink-0">Gửi</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thanh thông báo đang trả lời tin nhắn */}
      {win.replyingTo && (
        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border bg-background/70 px-3 py-1.5 text-xs">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              Đang trả lời {win.replyingTo.isMine ? 'chính bạn' : win.replyingTo.senderName}
            </p>
            <p className="text-[11px] text-muted truncate">{win.replyingTo.text}</p>
          </div>
          <button
            type="button"
            onClick={() => controller.handleCancelReply(friend.id)}
            aria-label="Hủy trả lời"
            className="text-muted hover:text-foreground shrink-0 cursor-pointer"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mini Picker cho Emoji / Sticker / GIF */}
      {win.pickerTab !== 'none' && (
        <div
          ref={pickerRef}
          className="shrink-0 border-t border-border bg-background/60 px-3 py-2 space-y-1.5"
        >
          {win.pickerTab === 'emoji' && (
            <Suspense
              fallback={
                <div className="flex h-[300px] items-center justify-center">
                  <LoadingSpinner />
                </div>
              }
            >
              <ChatEmojiPicker onSelect={(emoji) => controller.handleInsertEmoji(friend.id, emoji)} />
            </Suspense>
          )}

          {win.pickerTab === 'sticker' && (
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => controller.handleSendStickerOrGif(friend.id, sticker)}
                  className="rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/60 text-left cursor-pointer"
                >
                  {sticker}
                </button>
              ))}
            </div>
          )}

          {win.pickerTab === 'gif' && (
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_GIFS.map((gif) => (
                <button
                  key={gif}
                  type="button"
                  onClick={() => controller.handleSendStickerOrGif(friend.id, gif)}
                  className="rounded-lg bg-card border border-border px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-secondary/60 text-left cursor-pointer"
                >
                  {gif}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thanh nhập tin nhắn ĐỘNG ở đáy */}
      <form
        onSubmit={(e) => controller.handleSendChatMessage(friend.id, e)}
        className="shrink-0 flex items-center gap-1.5 border-t border-border bg-card px-2.5 py-2"
      >
        {!isTyping ? (
          <div className="flex items-center gap-0.5 shrink-0 transition-all duration-200">
            <button
              type="button"
              onClick={() => controller.handleVoiceOrCallAction('mic')}
              aria-label="Gửi tin nhắn thoại"
              title="Ghi âm"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              <MicIcon className="w-4 h-4" />
            </button>

            <label
              title="Gửi hình ảnh"
              aria-label="Chọn hình ảnh"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => controller.handlePickChatImage(friend.id, e)}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={() => controller.handleToggleChatPicker(friend.id, 'sticker')}
              aria-label="Chọn nhãn dán"
              title="Nhãn dán"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                win.pickerTab === 'sticker'
                  ? 'bg-secondary text-primary-active'
                  : 'text-primary hover:bg-secondary/60'
              }`}
            >
              <StickerIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => controller.handleToggleChatPicker(friend.id, 'gif')}
              aria-label="Chọn ảnh động GIF"
              title="Chọn GIF"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                win.pickerTab === 'gif'
                  ? 'bg-secondary text-primary-active'
                  : 'text-primary hover:bg-secondary/60'
              }`}
            >
              <GifIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div ref={plusMenuRef} className="relative shrink-0 transition-all duration-200">
            <button
              type="button"
              onClick={() => controller.handleToggleChatPlusMenu(friend.id)}
              aria-label="Mở thêm tùy chọn đính kèm"
              title="Thêm đính kèm"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                win.isPlusMenuOpen
                  ? 'bg-secondary text-primary-active'
                  : 'text-primary hover:bg-secondary/60'
              }`}
            >
              <PlusCircleIcon className="w-5 h-5" />
            </button>

            {win.isPlusMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-md z-30">
                <button
                  type="button"
                  onClick={() => controller.handleVoiceOrCallAction('mic')}
                  title="Ghi âm"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 cursor-pointer"
                >
                  <MicIcon className="w-4 h-4" />
                </button>
                <label
                  title="Gửi hình ảnh"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => controller.handlePickChatImage(friend.id, e)}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => controller.handleToggleChatPicker(friend.id, 'sticker')}
                  title="Nhãn dán"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 cursor-pointer"
                >
                  <StickerIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => controller.handleToggleChatPicker(friend.id, 'gif')}
                  title="GIF"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-secondary/60 cursor-pointer"
                >
                  <GifIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 min-w-0 transition-all duration-200">
          <input
            id={`lyora-mini-chat-input-${friend.id}`}
            type="text"
            value={win.draft}
            onChange={(e) => controller.handleChatDraftChange(friend.id, e)}
            placeholder="Aa"
            aria-label={`Nhập tin nhắn tới ${friend.fullName}`}
            className="w-full rounded-full border border-border bg-background pl-3.5 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => controller.handleToggleChatPicker(friend.id, 'emoji')}
            aria-label="Chèn biểu tượng cảm xúc"
            title="Biểu tượng cảm xúc"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-primary hover:bg-secondary/60 cursor-pointer"
          >
            <SmileIcon className="w-4 h-4" />
          </button>
        </div>

        {!isTyping ? (
          <button
            type="button"
            onClick={() => controller.handleSendQuickLike(friend.id)}
            aria-label="Gửi lượt thích nhanh"
            title="Gửi lượt thích"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-secondary/60 active:scale-95 transition-all cursor-pointer"
          >
            <ThumbUpIcon className="w-4 h-4" filled />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            title="Gửi"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active active:scale-95 transition-all cursor-pointer"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        )}
      </form>
    </section>
  );
};

export const FriendChatWidget: React.FC<FriendChatWidgetProps> = ({ controller }) => {
  const openWindows = controller.openChatWindows;
  if (openWindows.length === 0) {
    return null;
  }

  const expandedWindows = openWindows.filter((win) => !win.isMinimized);
  const minimizedWindows = openWindows.filter((win) => win.isMinimized);

  return (
    <div className="fixed bottom-20 md:bottom-4 right-3 sm:right-5 z-40 flex items-end justify-end gap-3 pointer-events-none">
      {/* Tối đa 3 hộp thoại mở hẳn song song */}
      {expandedWindows.map((win, idx) => {
        const friend = controller.getFriendById(win.friendId);
        if (!friend) return null;
        const isLast = idx === expandedWindows.length - 1;

        return (
          <SingleChatWindow
            key={win.friendId}
            win={win}
            friend={friend}
            isPrimaryOnMobile={isLast}
            controller={controller}
          />
        );
      })}

      {/* Tối đa 2 ô avatar nhỏ thu gọn nằm dọc bên góc phải dưới */}
      {minimizedWindows.length > 0 && (
        <div className="pointer-events-auto flex flex-col-reverse items-center gap-2.5 shrink-0 pb-1">
          {minimizedWindows.map((win) => {
            const friend = controller.getFriendById(win.friendId);
            if (!friend) return null;

            return (
              <div key={win.friendId} className="group relative">
                <button
                  type="button"
                  onClick={() => controller.handleOpenChatWithFriend(friend.id)}
                  title={`Mở lại trò chuyện với ${friend.fullName}`}
                  aria-label={`Mở lại trò chuyện với ${friend.fullName}`}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-card bg-card shadow-md hover:scale-105 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <FriendAvatar
                    name={friend.fullName}
                    avatarUrl={friend.avatarUrl}
                    sizeClass="h-11 w-11 text-sm"
                  />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    controller.handleCloseChatWindow(friend.id);
                  }}
                  aria-label={`Đóng hộp chat với ${friend.fullName}`}
                  title="Đóng"
                  className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-error hover:text-on-primary transition-opacity cursor-pointer"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
