import { loginSchema } from '../auth.validation';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const parsed = loginSchema.parse({
      email: 'hr.manager@acme.example',
      password: 'ChangeMeNow!123',
    });
    expect(parsed.email).toBe('hr.manager@acme.example');
  });

  it('rejects short passwords and invalid emails', () => {
    expect(() =>
      loginSchema.parse({ email: 'bad', password: 'short' }),
    ).toThrow();
  });
});
