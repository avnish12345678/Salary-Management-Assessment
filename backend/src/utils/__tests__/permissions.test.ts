import { Role } from '@prisma/client';
import { getPermissionsForRole, hasPermission } from '../permissions';

describe('permissions', () => {
  it('grants SUPER_ADMIN full access', () => {
    expect(hasPermission(Role.SUPER_ADMIN, 'salaries:write')).toBe(true);
    expect(hasPermission(Role.SUPER_ADMIN, 'audit:write')).toBe(true);
  });

  it('allows HR_MANAGER salary writes and denies audit write', () => {
    expect(hasPermission(Role.HR_MANAGER, 'salaries:write')).toBe(true);
    expect(hasPermission(Role.HR_MANAGER, 'audit:write')).toBe(false);
  });

  it('allows HR_EXECUTIVE employee write but not salary write', () => {
    expect(hasPermission(Role.HR_EXECUTIVE, 'employees:write')).toBe(true);
    expect(hasPermission(Role.HR_EXECUTIVE, 'salaries:write')).toBe(false);
    expect(hasPermission(Role.HR_EXECUTIVE, 'reports:export')).toBe(false);
  });

  it('keeps VIEWER read-only', () => {
    expect(hasPermission(Role.VIEWER, 'employees:read')).toBe(true);
    expect(hasPermission(Role.VIEWER, 'employees:write')).toBe(false);
    expect(hasPermission(Role.VIEWER, 'reports:export')).toBe(false);
    expect(getPermissionsForRole(Role.VIEWER)).not.toContain('salaries:write');
  });
});
