export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'HR_EXECUTIVE' | 'VIEWER';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId: string | null;
  createdAt: string;
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: { message: string; details: unknown } | null;
  meta: unknown;
};
