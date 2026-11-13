import { hashPassword, verifyPassword } from '../password';

describe('password helpers', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('ChangeMeNow!123');
    expect(hash).not.toContain('ChangeMeNow!123');
    await expect(verifyPassword('ChangeMeNow!123', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
