import request from 'supertest';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { calculateGross, serializeMoney } from '../src/utils/money';

const canRunDbTests = process.env.RUN_DB_TESTS === 'true';
const describeDb = canRunDbTests ? describe : describe.skip;

describeDb('employees & salaries integration (requires RUN_DB_TESTS=true)', () => {
  const prisma = new PrismaClient();
  let app: import('express').Express;
  let token: string;
  let countryId: string;
  let departmentId: string;
  const password = 'IntegrationTest!123';
  const email = 'integration.manager@acme.example';

  beforeAll(async () => {
    const { createApp } = await import('../src/app');
    app = createApp();

    const passwordHash = await bcrypt.hash(password, 8);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: Role.HR_MANAGER, isActive: true },
      create: { email, passwordHash, role: Role.HR_MANAGER, isActive: true },
    });

    const country = await prisma.country.upsert({
      where: { code: 'ZZ' },
      update: { name: 'Testland', currencyCode: 'USD' },
      create: { code: 'ZZ', name: 'Testland', currencyCode: 'USD' },
    });
    const department = await prisma.department.upsert({
      where: { code: 'TST' },
      update: { name: 'Test Dept', isActive: true },
      create: { code: 'TST', name: 'Test Dept', isActive: true },
    });
    countryId = country.id;
    departmentId = department.id;

    const login = await request(app).post('/api/auth/login').send({ email, password });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    const integrationEmployees = await prisma.employee.findMany({
      where: { email: { endsWith: '@integration.acme.example' } },
      select: { id: true },
    });
    const employeeIds = integrationEmployees.map((e) => e.id);
    const salaryIds = (
      await prisma.salaryRecord.findMany({
        where: { employeeId: { in: employeeIds } },
        select: { id: true },
      })
    ).map((s) => s.id);

    await prisma.salaryRevision.deleteMany({ where: { employeeId: { in: employeeIds } } });
    await prisma.auditLog.deleteMany({
      where: { OR: [{ entityId: { in: employeeIds } }, { entityId: { in: salaryIds } }] },
    });
    await prisma.salaryRecord.deleteMany({ where: { employeeId: { in: employeeIds } } });
    await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('creates an employee with initial salary and paginates/filters', async () => {
    const createRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeCode: 'INT-0001',
        firstName: 'Integration',
        lastName: 'Employee',
        email: 'one@integration.acme.example',
        departmentId,
        designation: 'QA Engineer',
        countryId,
        city: 'Test City',
        joiningDate: '2024-01-15',
        initialSalary: {
          baseSalary: 90000,
          bonus: 5000,
          allowances: 2000,
          deductions: 3000,
          currency: 'USD',
          effectiveFrom: '2024-01-15',
        },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.currentSalary.netSalary).toBe(
      serializeMoney(calculateGross({
        baseSalary: 90000,
        bonus: 5000,
        allowances: 2000,
        deductions: 3000,
      }).minus(3000)),
    );

    const listRes = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: 'INT-0001', page: 1, pageSize: 10 });

    expect(listRes.status).toBe(200);
    expect(listRes.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0].employeeCode).toBe('INT-0001');
  });

  it('revises salary without overwriting history and writes audit log', async () => {
    const employee = await prisma.employee.findUnique({
      where: { email: 'one@integration.acme.example' },
    });
    expect(employee).toBeTruthy();

    const reviseRes = await request(app)
      .post(`/api/salaries/employees/${employee!.id}/revisions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        baseSalary: 100000,
        bonus: 6000,
        allowances: 2500,
        deductions: 3500,
        currency: 'USD',
        effectiveFrom: '2025-01-01',
        changeReason: 'Promotion',
      });

    expect(reviseRes.status).toBe(201);
    expect(reviseRes.body.data.current.baseSalary).toBe('100000.00');

    const history = await request(app)
      .get(`/api/salaries/employees/${employee!.id}/history`)
      .set('Authorization', `Bearer ${token}`);

    expect(history.body.data.length).toBeGreaterThanOrEqual(2);
    expect(history.body.data.some((r: { effectiveTo: string | null }) => r.effectiveTo === null)).toBe(
      true,
    );
    expect(history.body.data.some((r: { effectiveTo: string | null }) => r.effectiveTo !== null)).toBe(
      true,
    );

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'SALARY_UPDATE', entityId: reviseRes.body.data.current.id },
    });
    expect(audit).toBeTruthy();
  });

  it('rejects overlapping salary revisions', async () => {
    const employee = await prisma.employee.findUnique({
      where: { email: 'one@integration.acme.example' },
    });

    const res = await request(app)
      .post(`/api/salaries/employees/${employee!.id}/revisions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        baseSalary: 110000,
        bonus: 0,
        allowances: 0,
        deductions: 0,
        currency: 'USD',
        effectiveFrom: '2024-06-01',
        changeReason: 'Invalid overlap attempt',
      });

    expect([400, 409]).toContain(res.status);
  });

  it('returns currency-specific dashboard payroll totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/analytics')
      .set('Authorization', `Bearer ${token}`)
      .query({ currency: 'USD' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.kpis.payrollByCurrency)).toBe(true);
    for (const row of res.body.data.kpis.payrollByCurrency) {
      expect(row.currency).toBe('USD');
    }
  });

  it('enforces RBAC on salary writes for viewers', async () => {
    const viewerEmail = 'viewer@integration.acme.example';
    const passwordHash = await bcrypt.hash(password, 8);
    await prisma.user.upsert({
      where: { email: viewerEmail },
      update: { passwordHash, role: Role.VIEWER, isActive: true },
      create: { email: viewerEmail, passwordHash, role: Role.VIEWER, isActive: true },
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: viewerEmail, password });
    const viewerToken = login.body.data.accessToken;

    const employee = await prisma.employee.findUnique({
      where: { email: 'one@integration.acme.example' },
    });

    const forbidden = await request(app)
      .post(`/api/salaries/employees/${employee!.id}/revisions`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        baseSalary: 120000,
        bonus: 0,
        allowances: 0,
        deductions: 0,
        currency: 'USD',
        effectiveFrom: '2026-01-01',
      });

    expect(forbidden.status).toBe(403);

    await prisma.user.deleteMany({ where: { email: viewerEmail } });
  });
});
