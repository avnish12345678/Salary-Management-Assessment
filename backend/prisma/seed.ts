/**
 * Phase 2 seed: reference data + initial HR Manager account.
 * Phase 5 will extend this to exactly 10,000 deterministic employees.
 * Safe to re-run (upserts; no duplicate users/countries/departments).
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HR_EMAIL = 'hr.manager@acme.example';
const HR_PASSWORD = 'ChangeMeNow!123';

const countries = [
  { code: 'US', name: 'United States', currencyCode: 'USD' },
  { code: 'IN', name: 'India', currencyCode: 'INR' },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP' },
  { code: 'DE', name: 'Germany', currencyCode: 'EUR' },
  { code: 'SG', name: 'Singapore', currencyCode: 'SGD' },
];

const departments = [
  { code: 'ENG', name: 'Engineering' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'FIN', name: 'Finance' },
  { code: 'SAL', name: 'Sales' },
  { code: 'OPS', name: 'Operations' },
  { code: 'MKT', name: 'Marketing' },
];

async function main() {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, currencyCode: country.currencyCode },
      create: country,
    });
  }

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name, isActive: true },
      create: { ...department, isActive: true },
    });
  }

  const passwordHash = await bcrypt.hash(HR_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: HR_EMAIL },
    update: {
      passwordHash,
      role: Role.HR_MANAGER,
      isActive: true,
    },
    create: {
      email: HR_EMAIL,
      passwordHash,
      role: Role.HR_MANAGER,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'super.admin@acme.example' },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: 'super.admin@acme.example',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Seed complete (Phase 2 bootstrap).');
  console.log(`HR Manager login: ${HR_EMAIL} / ${HR_PASSWORD}`);
  console.log('Change default passwords after first login in production.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
