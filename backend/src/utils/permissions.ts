import { Role } from '@prisma/client';

export type Permission =
  | 'employees:read'
  | 'employees:write'
  | 'salaries:read'
  | 'salaries:write'
  | 'dashboard:read'
  | 'reports:read'
  | 'reports:export'
  | 'audit:read'
  | 'audit:write'
  | 'settings:write';

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'employees:read',
    'employees:write',
    'salaries:read',
    'salaries:write',
    'dashboard:read',
    'reports:read',
    'reports:export',
    'audit:read',
    'audit:write',
    'settings:write',
  ],
  HR_MANAGER: [
    'employees:read',
    'employees:write',
    'salaries:read',
    'salaries:write',
    'dashboard:read',
    'reports:read',
    'reports:export',
    'audit:read',
  ],
  HR_EXECUTIVE: [
    'employees:read',
    'employees:write',
    'salaries:read',
    'dashboard:read',
    'reports:read',
  ],
  VIEWER: [
    'employees:read',
    'salaries:read',
    'dashboard:read',
    'reports:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function getPermissionsForRole(role: Role): Permission[] {
  return [...rolePermissions[role]];
}
