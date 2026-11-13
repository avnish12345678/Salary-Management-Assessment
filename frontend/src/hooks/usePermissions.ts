import { useAuth } from '../features/auth/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const permissions = new Set(user?.permissions ?? []);

  return {
    can: (permission: string) => permissions.has(permission),
    canWriteEmployees: permissions.has('employees:write'),
    canWriteSalaries: permissions.has('salaries:write'),
    canReadSalaries: permissions.has('salaries:read'),
  };
}
