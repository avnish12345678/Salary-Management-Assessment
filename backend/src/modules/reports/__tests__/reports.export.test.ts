import { flattenReportForExport } from '../reports.service';

describe('flattenReportForExport', () => {
  it('flattens report sections into exportable rows', () => {
    const flat = flattenReportForExport({
      generatedAt: '2026-01-01T00:00:00.000Z',
      filters: { currency: 'USD', format: 'json' },
      answers: {
        payrollByCountry: [
          {
            country: 'United States',
            currency: 'USD',
            totalPayroll: '100000.00',
            averageSalary: '100000.00',
            employeeCount: 1,
          },
        ],
        highestPayrollDepartmentByCurrency: [
          {
            department: 'Engineering',
            currency: 'USD',
            totalPayroll: '100000.00',
            employeeCount: 1,
          },
        ],
        averageSalaryByDepartment: [],
        topPaidEmployees: [],
        employeesInSalaryRangeByCurrency: [],
        highestAverageSalaryCountryByCurrency: [],
        salaryRevisionsThisMonth: 3,
        previousVsCurrentSalary: [],
      },
      notes: {
        currencyPolicy: 'x',
        topPaidNote: 'y',
      },
    });

    expect(flat.headers[0]).toBe('section');
    expect(flat.rows.some((row) => row[0] === 'payroll_by_country')).toBe(true);
    expect(flat.rows.some((row) => row[0] === 'revisions_this_month' && row[4] === 3)).toBe(true);
  });
});
