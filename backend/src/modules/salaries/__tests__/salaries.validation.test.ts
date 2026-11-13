import { createOrReviseSalarySchema } from '../salaries.validation';

describe('salaries validation', () => {
  it('accepts a valid revision payload', () => {
    const parsed = createOrReviseSalarySchema.parse({
      baseSalary: 120000,
      bonus: 5000,
      allowances: 2000,
      deductions: 1000,
      currency: 'usd',
      effectiveFrom: '2025-01-01',
      changeReason: 'Annual review',
    });
    expect(parsed.currency).toBe('USD');
  });

  it('rejects deductions greater than gross', () => {
    expect(() =>
      createOrReviseSalarySchema.parse({
        baseSalary: 1000,
        bonus: 0,
        allowances: 0,
        deductions: 2000,
        currency: 'USD',
        effectiveFrom: '2025-01-01',
      }),
    ).toThrow();
  });
});
