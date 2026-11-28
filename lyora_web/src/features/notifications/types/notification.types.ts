export type NotificationKind =
  | "FRIEND_REQUEST"
  | "FRIEND_REQUEST_ACCEPTED"
  | "POST_HIDDEN"
  | "POST_RESTORED"
  | "POST_REMOVED"
  | "COMMENT_REMOVED"
  | "POST_APPEAL_SUBMITTED"
  | "POST_APPEAL_REJECTED";

export interface AppNotification {
  id: string;
  actorId: string;
  type: NotificationKind;
  title: string;
  description: string;
  targetPath: string | null;
  isRead: boolean;
  createdAt: string;
}
