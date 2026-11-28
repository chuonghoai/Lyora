export type NotificationKind =
  | "FRIEND_REQUEST"
  | "FRIEND_REQUEST_ACCEPTED"
  | "POST_HIDDEN"
  | "POST_RESTORED"
  | "POST_REMOVED"
  | "COMMENT_REMOVED";

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
