import { Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { UnauthorizedError, ValidationError } from '../../utils/errors';
import { signAccessToken } from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import { getPermissionsForRole } from '../../utils/permissions';
import { ChangePasswordInput, LoginInput } from './auth.validation';

type UserRecord = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId: string | null;
  createdAt: Date;
};

function toPublicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId,
    createdAt: user.createdAt,
    permissions: getPermissionsForRole(user.role),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
    tokenType: 'Bearer' as const,
    user: toPublicUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      employeeId: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User is inactive or does not exist');
  }

  return toPublicUser(user);
}

export function logout() {
  return {
    message: 'Logged out successfully. Discard the client token.',
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, passwordHash: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User is inactive or does not exist');
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new ValidationError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return {
    message: 'Password updated successfully',
  };
}
