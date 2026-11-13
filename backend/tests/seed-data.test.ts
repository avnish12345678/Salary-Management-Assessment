import {
  assertWorkforceIntegrity,
  createRng,
  employeeCode,
  employeeEmail,
  generateWorkforce,
  SEED_CONSTANTS,
} from '../prisma/seed-data';

describe('deterministic seed data', () => {
  it('generates exactly 10,000 unique employees for the fixed seed', () => {
    const workforce = generateWorkforce();
    const integrity = assertWorkforceIntegrity(workforce);

    expect(integrity.count).toBe(SEED_CONSTANTS.EMPLOYEE_COUNT);
    expect(integrity.uniqueCodes).toBe(SEED_CONSTANTS.EMPLOYEE_COUNT);
    expect(integrity.uniqueEmails).toBe(SEED_CONSTANTS.EMPLOYEE_COUNT);
    expect(integrity.currencies.length).toBeGreaterThan(1);
    expect(integrity.activeCount).toBeGreaterThan(0);
    expect(integrity.inactiveCount).toBeGreaterThan(0);
    expect(workforce.every((e) => e.salary.currency.length === 3)).toBe(true);
    expect(workforce.every((e) => e.salary.baseSalary > 0)).toBe(true);
  });

  it('is reproducible for the same seed', () => {
    const a = generateWorkforce(100, SEED_CONSTANTS.RNG_SEED);
    const b = generateWorkforce(100, SEED_CONSTANTS.RNG_SEED);
    expect(a).toEqual(b);
  });

  it('differs when the seed changes', () => {
    const a = generateWorkforce(50, 1);
    const b = generateWorkforce(50, 2);
    expect(a[0]?.email).not.toBe(b[0]?.email);
  });

  it('creates stable employee codes and emails', () => {
    expect(employeeCode(0)).toBe('ACME-000001');
    expect(employeeCode(9999)).toBe('ACME-010000');
    expect(employeeEmail(0, 'Ada', 'Lovelace')).toBe('ada.lovelace.1@acme.example');
  });

  it('keeps RNG in 0..1 range', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
