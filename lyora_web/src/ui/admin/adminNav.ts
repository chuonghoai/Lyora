import { ROUTES } from '@/routes/paths';

export type AdminNavIconName =
  | 'dashboard'
  | 'users'
  | 'posts'
  | 'comments'
  | 'ai'
  | 'analytics'
  | 'moderation'
  | 'settings';

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  icon: AdminNavIconName;
  exact?: boolean;
  implemented: boolean;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    items: [
      {
        id: 'dashboard',
        label: 'Bảng điều khiển',
        path: ROUTES.ADMIN.DASHBOARD,
        icon: 'dashboard',
        exact: true,
        implemented: true,
      },
    ],
  },
  {
    id: 'community',
    label: 'Quản lý cộng đồng',
    items: [
      {
        id: 'users',
        label: 'Quản lý người dùng',
        path: '/admin/users',
        icon: 'users',
        implemented: false,
      },
      {
        id: 'posts',
        label: 'Quản lý bài viết',
        path: '/admin/posts',
        icon: 'posts',
        implemented: false,
      },
      {
        id: 'comments',
        label: 'Quản lý bình luận',
        path: '/admin/comments',
        icon: 'comments',
        implemented: false,
      },
      {
        id: 'moderation',
        label: 'Báo cáo & Kiểm duyệt',
        path: '/admin/reports',
        icon: 'moderation',
        implemented: false,
      },
    ],
  },
  {
    id: 'platform',
    label: 'Hệ thống & Phân tích',
    items: [
      {
        id: 'ai',
        label: 'Quản lý tính năng AI',
        path: '/admin/ai',
        icon: 'ai',
        implemented: false,
      },
      {
        id: 'analytics',
        label: 'Báo cáo & Phân tích',
        path: '/admin/analytics',
        icon: 'analytics',
        implemented: false,
      },
      {
        id: 'settings',
        label: 'Cài đặt hệ thống',
        path: '/admin/settings',
        icon: 'settings',
        implemented: false,
      },
    ],
  },
];

function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed || '/';
}

/**
 * Xác định trạng thái Active của mục Sidebar dựa trên URL hiện tại, hỗ trợ nested path.
 */
export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(item.path);

  if (item.exact) {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export interface AdminNavSearchEntry extends AdminNavItem {
  groupId: string;
  groupLabel: string;
}

function foldVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function getAllAdminNavItems(): AdminNavSearchEntry[] {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupId: group.id,
      groupLabel: group.label,
    })),
  );
}

/**
 * Lọc danh sách chức năng Admin cục bộ ở frontend theo từ khóa (hỗ trợ không dấu).
 */
export function filterAdminNavItems(query: string): AdminNavSearchEntry[] {
  const all = getAllAdminNavItems();
  const normalized = foldVietnamese(query.trim());
  if (!normalized) return all;

  return all.filter((item) => {
    const labelFolded = foldVietnamese(item.label);
    const groupFolded = foldVietnamese(item.groupLabel);
    return labelFolded.includes(normalized) || groupFolded.includes(normalized);
  });
}
