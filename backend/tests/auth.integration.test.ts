import request from 'supertest';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;
const canRunDbTests = process.env.RUN_DB_TESTS === 'true';

const describeDb = canRunDbTests ? describe : describe.skip;

describeDb('auth integration (requires RUN_DB_TESTS=true and PostgreSQL)', () => {
  const prisma = new PrismaClient();
  let app: import('express').Express;
  const email = 'integration.hr@acme.example';
  const password = 'IntegrationTest!123';

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    const { createApp } = await import('../src/app');
    app = createApp();

    const passwordHash = await bcrypt.hash(password, 8);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: Role.HR_MANAGER, isActive: true },
      create: { email, passwordHash, role: Role.HR_MANAGER, isActive: true },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('logs in successfully and returns current user without password hash', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeTruthy();
    expect(loginRes.body.data.user.passwordHash).toBeUndefined();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(email);
    expect(meRes.body.data.role).toBe(Role.HR_MANAGER);
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password-here' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthorized access to /me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
