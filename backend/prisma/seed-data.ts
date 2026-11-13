/**
 * Deterministic workforce generator for ACME seed.
 * Pure functions — safe to unit test without a database.
 */

export const SEED_CONSTANTS = {
  RNG_SEED: 20261113,
  EMPLOYEE_COUNT: 10_000,
  BATCH_SIZE: 500,
  HR_EMAIL: 'hr.manager@acme.example',
  HR_PASSWORD: 'ChangeMeNow!123',
  SUPER_ADMIN_EMAIL: 'super.admin@acme.example',
} as const;

export const COUNTRIES = [
  { code: 'US', name: 'United States', currencyCode: 'USD', cities: ['San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago'] },
  { code: 'IN', name: 'India', currencyCode: 'INR', cities: ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Chennai'] },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', cities: ['London', 'Manchester', 'Bristol', 'Edinburgh', 'Leeds'] },
  { code: 'DE', name: 'Germany', currencyCode: 'EUR', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { code: 'SG', name: 'Singapore', currencyCode: 'SGD', cities: ['Singapore'] },
  { code: 'AU', name: 'Australia', currencyCode: 'AUD', cities: ['Sydney', 'Melbourne', 'Brisbane'] },
  { code: 'CA', name: 'Canada', currencyCode: 'CAD', cities: ['Toronto', 'Vancouver', 'Montreal'] },
  { code: 'JP', name: 'Japan', currencyCode: 'JPY', cities: ['Tokyo', 'Osaka', 'Nagoya'] },
] as const;

export const DEPARTMENTS = [
  { code: 'ENG', name: 'Engineering' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'FIN', name: 'Finance' },
  { code: 'SAL', name: 'Sales' },
  { code: 'OPS', name: 'Operations' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'CS', name: 'Customer Success' },
  { code: 'LEG', name: 'Legal' },
] as const;

export const DESIGNATIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'Product Manager',
  'HR Business Partner',
  'Finance Analyst',
  'Senior Finance Analyst',
  'Account Executive',
  'Sales Manager',
  'Operations Specialist',
  'Marketing Manager',
  'Customer Success Manager',
  'Legal Counsel',
  'Data Analyst',
] as const;

const FIRST_NAMES = [
  'Aisha', 'Rohan', 'Emily', 'Jonas', 'Mei', 'Carlos', 'Priya', 'James', 'Sofia', 'Kenji',
  'Olivia', 'Liam', 'Noah', 'Ava', 'Isabella', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'Harper',
  'Alexander', 'Charlotte', 'Benjamin', 'Evelyn', 'Henry', 'Abigail', 'Sebastian', 'Ella', 'Jack', 'Scarlett',
  'Ananya', 'Arjun', 'Diya', 'Kabir', 'Neha', 'Vikram', 'Sara', 'Omar', 'Fatima', 'Yuki',
];

const LAST_NAMES = [
  'Patel', 'Mehta', 'Carter', 'Weber', 'Tan', 'Garcia', 'Sharma', 'Smith', 'Rossi', 'Nakamura',
  'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark',
  'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott',
];

/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function employeeCode(index: number): string {
  return `ACME-${String(index + 1).padStart(6, '0')}`;
}

export function employeeEmail(index: number, firstName: string, lastName: string): string {
  const slug = `${firstName}.${lastName}.${index + 1}`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '');
  return `${slug}@acme.example`;
}

/** Deterministic UUID-like id for stable batch inserts. */
export function deterministicId(prefix: number, index: number): string {
  const hex = (prefix * 1_000_000 + index).toString(16).padStart(12, '0');
  return `a0000000-0000-4000-8000-${hex}`;
}

export type GeneratedEmployee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentCode: string;
  designation: string;
  countryCode: string;
  city: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'INACTIVE';
  managerIndex: number | null;
  salary: {
    id: string;
    baseSalary: number;
    bonus: number;
    allowances: number;
    deductions: number;
    currency: string;
    effectiveFrom: string;
  };
  priorSalary?: {
    id: string;
    baseSalary: number;
    bonus: number;
    allowances: number;
    deductions: number;
    currency: string;
    effectiveFrom: string;
    effectiveTo: string;
  };
};

function salaryRangeForCurrency(currency: string): { min: number; max: number } {
  switch (currency) {
    case 'INR':
      return { min: 600_000, max: 4_500_000 };
    case 'JPY':
      return { min: 4_500_000, max: 14_000_000 };
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'SGD':
      return { min: 45_000, max: 210_000 };
    case 'GBP':
    case 'EUR':
      return { min: 35_000, max: 160_000 };
    default:
      return { min: 40_000, max: 180_000 };
  }
}

function money(rng: () => number, min: number, max: number): number {
  const value = min + rng() * (max - min);
  return Math.round(value * 100) / 100;
}

function dateFromOffset(rng: () => number, startYear: number, endYear: number): string {
  const year = startYear + Math.floor(rng() * (endYear - startYear + 1));
  const month = 1 + Math.floor(rng() * 12);
  const day = 1 + Math.floor(rng() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function generateWorkforce(
  count: number = SEED_CONSTANTS.EMPLOYEE_COUNT,
  seed: number = SEED_CONSTANTS.RNG_SEED,
): GeneratedEmployee[] {
  const rng = createRng(seed);
  const employees: GeneratedEmployee[] = [];

  for (let i = 0; i < count; i += 1) {
    const country = pick(rng, COUNTRIES);
    const department = pick(rng, DEPARTMENTS);
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const range = salaryRangeForCurrency(country.currencyCode);
    const baseSalary = money(rng, range.min, range.max);
    const bonus = money(rng, 0, baseSalary * 0.15);
    const allowances = money(rng, 0, baseSalary * 0.08);
    const deductions = money(rng, 0, baseSalary * 0.1);
    const joiningDate = dateFromOffset(rng, 2015, 2024);
    const effectiveFrom = dateFromOffset(rng, 2023, 2025);
    const inactive = rng() < 0.12;
    const hasPrior = rng() < 0.22;
    const managerIndex = i > 20 && rng() < 0.35 ? Math.floor(rng() * Math.min(i, 500)) : null;

    const currentSalaryId = deterministicId(2, i);
    let priorSalary: GeneratedEmployee['priorSalary'];

    if (hasPrior) {
      const priorBase = Math.round(baseSalary * (0.85 + rng() * 0.1) * 100) / 100;
      priorSalary = {
        id: deterministicId(3, i),
        baseSalary: priorBase,
        bonus: Math.round(bonus * 0.8 * 100) / 100,
        allowances: Math.round(allowances * 0.8 * 100) / 100,
        deductions: Math.round(deductions * 0.8 * 100) / 100,
        currency: country.currencyCode,
        effectiveFrom: dateFromOffset(rng, 2020, 2022),
        effectiveTo: '2022-12-31',
      };
    }

    employees.push({
      id: deterministicId(1, i),
      employeeCode: employeeCode(i),
      firstName,
      lastName,
      email: employeeEmail(i, firstName, lastName),
      phone: `+1-555-${String(1000 + (i % 9000)).padStart(4, '0')}`,
      departmentCode: department.code,
      designation: pick(rng, DESIGNATIONS),
      countryCode: country.code,
      city: pick(rng, country.cities),
      joiningDate,
      employmentStatus: inactive ? 'INACTIVE' : 'ACTIVE',
      managerIndex,
      salary: {
        id: currentSalaryId,
        baseSalary,
        bonus,
        allowances,
        deductions,
        currency: country.currencyCode,
        effectiveFrom,
      },
      priorSalary,
    });
  }

  return employees;
}

export function assertWorkforceIntegrity(employees: GeneratedEmployee[]) {
  const codes = new Set<string>();
  const emails = new Set<string>();
  const ids = new Set<string>();

  for (const employee of employees) {
    if (codes.has(employee.employeeCode)) {
      throw new Error(`Duplicate employee code: ${employee.employeeCode}`);
    }
    if (emails.has(employee.email)) {
      throw new Error(`Duplicate email: ${employee.email}`);
    }
    if (ids.has(employee.id)) {
      throw new Error(`Duplicate id: ${employee.id}`);
    }
    codes.add(employee.employeeCode);
    emails.add(employee.email);
    ids.add(employee.id);
  }

  return {
    count: employees.length,
    uniqueCodes: codes.size,
    uniqueEmails: emails.size,
    currencies: [...new Set(employees.map((e) => e.salary.currency))].sort(),
    activeCount: employees.filter((e) => e.employmentStatus === 'ACTIVE').length,
    inactiveCount: employees.filter((e) => e.employmentStatus === 'INACTIVE').length,
  };
}
