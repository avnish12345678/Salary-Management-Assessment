/**
 * Deterministic ACME seed:
 * - Exactly 10,000 employees
 * - Multi-country / multi-currency salaries
 * - Idempotent re-runs (skipDuplicates + backfill missing salaries)
 */
import { EmploymentStatus, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  assertWorkforceIntegrity,
  COUNTRIES,
  DEPARTMENTS,
  generateWorkforce,
  SEED_CONSTANTS,
} from './seed-data';

const prisma = new PrismaClient();

async function upsertReferenceData() {
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, currencyCode: country.currencyCode },
      create: {
        code: country.code,
        name: country.name,
        currencyCode: country.currencyCode,
      },
    });
  }

  for (const department of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name, isActive: true },
      create: {
        code: department.code,
        name: department.name,
        isActive: true,
      },
    });
  }

  const passwordHash = await bcrypt.hash(SEED_CONSTANTS.HR_PASSWORD, 10);

  const hrUser = await prisma.user.upsert({
    where: { email: SEED_CONSTANTS.HR_EMAIL },
    update: { passwordHash, role: Role.HR_MANAGER, isActive: true },
    create: {
      email: SEED_CONSTANTS.HR_EMAIL,
      passwordHash,
      role: Role.HR_MANAGER,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: SEED_CONSTANTS.SUPER_ADMIN_EMAIL },
    update: { passwordHash, role: Role.SUPER_ADMIN, isActive: true },
    create: {
      email: SEED_CONSTANTS.SUPER_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const countryByCode = Object.fromEntries(
    (await prisma.country.findMany()).map((c) => [c.code, c]),
  );
  const departmentByCode = Object.fromEntries(
    (await prisma.department.findMany()).map((d) => [d.code, d]),
  );

  return { hrUser, countryByCode, departmentByCode };
}

async function main() {
  console.log('Generating deterministic workforce...');
  const workforce = generateWorkforce();
  const integrity = assertWorkforceIntegrity(workforce);
  console.log(
    `Generated ${integrity.count} employees (${integrity.activeCount} active, ${integrity.inactiveCount} inactive) across currencies: ${integrity.currencies.join(', ')}`,
  );

  const { hrUser, countryByCode, departmentByCode } = await upsertReferenceData();

  const employeeRows = workforce.map((employee) => {
    const country = countryByCode[employee.countryCode];
    const department = departmentByCode[employee.departmentCode];
    if (!country || !department) {
      throw new Error(`Missing reference for ${employee.employeeCode}`);
    }
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      departmentId: department.id,
      designation: employee.designation,
      countryId: country.id,
      city: employee.city,
      joiningDate: new Date(`${employee.joiningDate}T00:00:00.000Z`),
      employmentStatus:
        employee.employmentStatus === 'ACTIVE'
          ? EmploymentStatus.ACTIVE
          : EmploymentStatus.INACTIVE,
      managerId: null as string | null,
    };
  });

  console.log('Inserting employees in batches...');
  for (let i = 0; i < employeeRows.length; i += SEED_CONSTANTS.BATCH_SIZE) {
    const batch = employeeRows.slice(i, i + SEED_CONSTANTS.BATCH_SIZE);
    await prisma.employee.createMany({
      data: batch,
      skipDuplicates: true,
    });
    if ((i / SEED_CONSTANTS.BATCH_SIZE) % 4 === 0) {
      console.log(`  employees ${Math.min(i + SEED_CONSTANTS.BATCH_SIZE, employeeRows.length)}/${employeeRows.length}`);
    }
  }

  // Second pass: assign managers in bulk (managers already exist from first insert).
  console.log('Assigning managers...');
  const managerUpdates = workforce
    .filter((e) => e.managerIndex !== null)
    .map((e) => ({
      id: e.id,
      managerId: workforce[e.managerIndex!]!.id,
    }));

  for (let i = 0; i < managerUpdates.length; i += SEED_CONSTANTS.BATCH_SIZE) {
    const batch = managerUpdates.slice(i, i + SEED_CONSTANTS.BATCH_SIZE);
    const values = batch
      .map((row) => `('${row.id}'::uuid, '${row.managerId}'::uuid)`)
      .join(', ');
    await prisma.$executeRawUnsafe(`
      UPDATE employees AS e
      SET manager_id = v.manager_id
      FROM (VALUES ${values}) AS v(id, manager_id)
      WHERE e.id = v.id
    `);
  }

  const existingOpen = await prisma.salaryRecord.findMany({
    where: { effectiveTo: null },
    select: { employeeId: true },
  });
  const employeesWithOpen = new Set(existingOpen.map((r) => r.employeeId));

  const salaryRows = [];
  const revisionRows = [];

  for (const employee of workforce) {
    if (employeesWithOpen.has(employee.id)) continue;

    if (employee.priorSalary) {
      salaryRows.push({
        id: employee.priorSalary.id,
        employeeId: employee.id,
        baseSalary: employee.priorSalary.baseSalary,
        bonus: employee.priorSalary.bonus,
        allowances: employee.priorSalary.allowances,
        deductions: employee.priorSalary.deductions,
        currency: employee.priorSalary.currency,
        effectiveFrom: new Date(`${employee.priorSalary.effectiveFrom}T00:00:00.000Z`),
        effectiveTo: new Date(`${employee.priorSalary.effectiveTo}T00:00:00.000Z`),
      });
    }

    salaryRows.push({
      id: employee.salary.id,
      employeeId: employee.id,
      baseSalary: employee.salary.baseSalary,
      bonus: employee.salary.bonus,
      allowances: employee.salary.allowances,
      deductions: employee.salary.deductions,
      currency: employee.salary.currency,
      effectiveFrom: new Date(`${employee.salary.effectiveFrom}T00:00:00.000Z`),
      effectiveTo: null,
    });

    if (employee.priorSalary) {
      revisionRows.push({
        id: deterministicRevisionId(employee.id),
        employeeId: employee.id,
        previousRecordId: employee.priorSalary.id,
        newRecordId: employee.salary.id,
        changedBy: hrUser.id,
        changeReason: 'Annual compensation review',
        createdAt: new Date(`${employee.salary.effectiveFrom}T12:00:00.000Z`),
      });
    }
  }

  console.log(`Inserting ${salaryRows.length} salary records...`);
  for (let i = 0; i < salaryRows.length; i += SEED_CONSTANTS.BATCH_SIZE) {
    const batch = salaryRows.slice(i, i + SEED_CONSTANTS.BATCH_SIZE);
    await prisma.salaryRecord.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  if (revisionRows.length > 0) {
    console.log(`Inserting ${revisionRows.length} salary revisions...`);
    for (let i = 0; i < revisionRows.length; i += SEED_CONSTANTS.BATCH_SIZE) {
      const batch = revisionRows.slice(i, i + SEED_CONSTANTS.BATCH_SIZE);
      await prisma.salaryRevision.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }

  const employeeCount = await prisma.employee.count();
  const openSalaryCount = await prisma.salaryRecord.count({ where: { effectiveTo: null } });

  console.log('Seed complete.');
  console.log(`Employees in DB: ${employeeCount}`);
  console.log(`Open salary records: ${openSalaryCount}`);
  console.log(`HR Manager login: ${SEED_CONSTANTS.HR_EMAIL} / ${SEED_CONSTANTS.HR_PASSWORD}`);
}

function deterministicRevisionId(employeeId: string): string {
  // Derive a stable UUID-like id from employee id suffix.
  const suffix = employeeId.slice(-12);
  return `b0000000-0000-4000-8000-${suffix}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
