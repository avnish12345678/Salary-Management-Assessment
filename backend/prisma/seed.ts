/**
 * Bootstrap seed: reference data, admin users, and a small sample workforce.
 * Phase 5 will extend this to exactly 10,000 deterministic employees.
 * Safe to re-run (upserts; no duplicate users/employees/countries/departments).
 */
import { EmploymentStatus, PrismaClient, Role } from '@prisma/client';
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

const sampleEmployees = [
  {
    employeeCode: 'ACME-000001',
    firstName: 'Aisha',
    lastName: 'Patel',
    email: 'aisha.patel@acme.example',
    phone: '+1-415-555-0101',
    departmentCode: 'ENG',
    designation: 'Senior Software Engineer',
    countryCode: 'US',
    city: 'San Francisco',
    joiningDate: new Date('2021-03-15'),
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: {
      baseSalary: 145000,
      bonus: 12000,
      allowances: 6000,
      deductions: 8500,
      currency: 'USD',
      effectiveFrom: new Date('2024-01-01'),
    },
  },
  {
    employeeCode: 'ACME-000002',
    firstName: 'Rohan',
    lastName: 'Mehta',
    email: 'rohan.mehta@acme.example',
    phone: '+91-98765-43210',
    departmentCode: 'ENG',
    designation: 'Engineering Manager',
    countryCode: 'IN',
    city: 'Bengaluru',
    joiningDate: new Date('2019-07-01'),
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: {
      baseSalary: 3200000,
      bonus: 400000,
      allowances: 180000,
      deductions: 250000,
      currency: 'INR',
      effectiveFrom: new Date('2024-04-01'),
    },
  },
  {
    employeeCode: 'ACME-000003',
    firstName: 'Emily',
    lastName: 'Carter',
    email: 'emily.carter@acme.example',
    phone: '+44-7700-900123',
    departmentCode: 'FIN',
    designation: 'Finance Analyst',
    countryCode: 'GB',
    city: 'London',
    joiningDate: new Date('2022-09-12'),
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: {
      baseSalary: 62000,
      bonus: 4000,
      allowances: 2500,
      deductions: 3200,
      currency: 'GBP',
      effectiveFrom: new Date('2023-10-01'),
    },
  },
  {
    employeeCode: 'ACME-000004',
    firstName: 'Jonas',
    lastName: 'Weber',
    email: 'jonas.weber@acme.example',
    phone: '+49-151-555-0199',
    departmentCode: 'SAL',
    designation: 'Account Executive',
    countryCode: 'DE',
    city: 'Berlin',
    joiningDate: new Date('2020-01-20'),
    employmentStatus: EmploymentStatus.INACTIVE,
    salary: {
      baseSalary: 78000,
      bonus: 15000,
      allowances: 3000,
      deductions: 4100,
      currency: 'EUR',
      effectiveFrom: new Date('2022-01-01'),
    },
  },
  {
    employeeCode: 'ACME-000005',
    firstName: 'Mei',
    lastName: 'Tan',
    email: 'mei.tan@acme.example',
    phone: '+65-8123-4567',
    departmentCode: 'HR',
    designation: 'HR Business Partner',
    countryCode: 'SG',
    city: 'Singapore',
    joiningDate: new Date('2018-11-05'),
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: {
      baseSalary: 98000,
      bonus: 8000,
      allowances: 5000,
      deductions: 4500,
      currency: 'SGD',
      effectiveFrom: new Date('2024-06-01'),
    },
  },
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

  const countryByCode = Object.fromEntries(
    (await prisma.country.findMany()).map((c) => [c.code, c]),
  );
  const departmentByCode = Object.fromEntries(
    (await prisma.department.findMany()).map((d) => [d.code, d]),
  );

  for (const sample of sampleEmployees) {
    const country = countryByCode[sample.countryCode];
    const department = departmentByCode[sample.departmentCode];
    if (!country || !department) continue;

    const employee = await prisma.employee.upsert({
      where: { employeeCode: sample.employeeCode },
      update: {
        firstName: sample.firstName,
        lastName: sample.lastName,
        email: sample.email,
        phone: sample.phone,
        departmentId: department.id,
        designation: sample.designation,
        countryId: country.id,
        city: sample.city,
        joiningDate: sample.joiningDate,
        employmentStatus: sample.employmentStatus,
      },
      create: {
        employeeCode: sample.employeeCode,
        firstName: sample.firstName,
        lastName: sample.lastName,
        email: sample.email,
        phone: sample.phone,
        departmentId: department.id,
        designation: sample.designation,
        countryId: country.id,
        city: sample.city,
        joiningDate: sample.joiningDate,
        employmentStatus: sample.employmentStatus,
      },
    });

    const openSalary = await prisma.salaryRecord.findFirst({
      where: { employeeId: employee.id, effectiveTo: null },
    });

    if (!openSalary) {
      await prisma.salaryRecord.create({
        data: {
          employeeId: employee.id,
          baseSalary: sample.salary.baseSalary,
          bonus: sample.salary.bonus,
          allowances: sample.salary.allowances,
          deductions: sample.salary.deductions,
          currency: sample.salary.currency,
          effectiveFrom: sample.salary.effectiveFrom,
          effectiveTo: null,
        },
      });
    }
  }

  console.log('Seed complete (Phase 3 bootstrap with sample employees).');
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
