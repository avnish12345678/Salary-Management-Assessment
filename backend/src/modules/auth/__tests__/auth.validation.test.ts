import { changePasswordSchema, loginSchema } from '../auth.validation';

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

describe('changePasswordSchema', () => {
  it('accepts a valid password change payload', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'ChangeMeNow!123',
      newPassword: 'EvenStronger!456',
      confirmPassword: 'EvenStronger!456',
    });
    expect(parsed.newPassword).toBe('EvenStronger!456');
  });

  it('rejects mismatched confirmation and reused passwords', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'ChangeMeNow!123',
        newPassword: 'EvenStronger!456',
        confirmPassword: 'Different!456',
      }),
    ).toThrow();

    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'ChangeMeNow!123',
        newPassword: 'ChangeMeNow!123',
        confirmPassword: 'ChangeMeNow!123',
      }),
    ).toThrow();
  });
});
