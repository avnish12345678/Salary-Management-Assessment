import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded?.sub || !decoded?.email || !decoded?.role) {
      throw new UnauthorizedError('Invalid token payload');
    }
    return decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
