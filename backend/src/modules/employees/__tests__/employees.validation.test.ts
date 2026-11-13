import { employeeCreateSchema, employeeListQuerySchema } from '../employees.validation';

describe('employees validation', () => {
  it('parses list query defaults', () => {
    const parsed = employeeListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.sortBy).toBe('joiningDate');
  });

  it('requires positive base salary for initial salary', () => {
    expect(() =>
      employeeCreateSchema.parse({
        employeeCode: 'ACME-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@acme.example',
        departmentId: '00000000-0000-4000-8000-000000000001',
        designation: 'Engineer',
        countryId: '00000000-0000-4000-8000-000000000002',
        city: 'London',
        joiningDate: '2024-01-01',
        initialSalary: {
          baseSalary: 0,
          currency: 'GBP',
          effectiveFrom: '2024-01-01',
        },
      }),
    ).toThrow();
  });
});
