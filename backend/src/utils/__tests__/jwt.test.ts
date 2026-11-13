import { Role } from '@prisma/client';
import { signAccessToken, verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';

describe('jwt helpers', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({
      sub: 'user-1',
      email: 'hr.manager@acme.example',
      role: Role.HR_MANAGER,
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('hr.manager@acme.example');
    expect(payload.role).toBe(Role.HR_MANAGER);
  });

  it('rejects invalid tokens', () => {
    expect(() => verifyAccessToken('not-a-token')).toThrow(UnauthorizedError);
  });
});
