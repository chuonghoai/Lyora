import { describe, expect, it } from 'vitest';
import {
  ADMIN_NAV_GROUPS,
  filterAdminNavItems,
  getAllAdminNavItems,
  isAdminNavActive,
} from '@/ui/admin/adminNav';

describe('adminNav feature search & active path helpers', () => {
  it('returns all admin features when query is empty or whitespace', () => {
    const expectedCount = ADMIN_NAV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
    expect(getAllAdminNavItems()).toHaveLength(expectedCount);
    expect(filterAdminNavItems('')).toHaveLength(expectedCount);
    expect(filterAdminNavItems('   ')).toHaveLength(expectedCount);
  });

  it('matches admin features regardless of Vietnamese diacritics and case', () => {
    const matches = filterAdminNavItems('nguoi dung');
    expect(matches.some((item) => item.id === 'users')).toBe(true);

    const moderationMatches = filterAdminNavItems('kiem duyet');
    expect(moderationMatches.some((item) => item.id === 'moderation')).toBe(true);
  });

  it('returns empty array when no admin feature matches', () => {
    expect(filterAdminNavItems('tinh nang khong ton tai xyz')).toEqual([]);
  });

  it('evaluates exact and nested admin nav active states accurately', () => {
    const dashboardItem = getAllAdminNavItems().find((i) => i.id === 'dashboard')!;
    const usersItem = getAllAdminNavItems().find((i) => i.id === 'users')!;

    expect(isAdminNavActive('/admin', dashboardItem)).toBe(true);
    expect(isAdminNavActive('/admin/', dashboardItem)).toBe(true);
    expect(isAdminNavActive('/admin/users', dashboardItem)).toBe(false);
    expect(isAdminNavActive('/admin/users/123', usersItem)).toBe(true);
  });
});

