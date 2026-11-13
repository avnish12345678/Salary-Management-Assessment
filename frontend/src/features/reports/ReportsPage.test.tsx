import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ReportsPage } from './ReportsPage';

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: (permission: string) => permission === 'reports:read',
    canWriteEmployees: false,
    canWriteSalaries: false,
    canReadSalaries: true,
  }),
}));

vi.mock('../../services/reference-service', () => ({
  fetchCountries: vi.fn().mockResolvedValue([]),
  fetchDepartments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/reports-service', () => ({
  fetchSalaryReport: vi.fn().mockResolvedValue({
    generatedAt: new Date().toISOString(),
    filters: {},
    answers: {
      payrollByCountry: [],
      highestPayrollDepartmentByCurrency: [],
      averageSalaryByDepartment: [],
      topPaidEmployees: [],
      employeesInSalaryRangeByCurrency: [],
      highestAverageSalaryCountryByCurrency: [],
      salaryRevisionsThisMonth: 0,
      previousVsCurrentSalary: [],
    },
    notes: {
      currencyPolicy: 'Financial amounts are never aggregated across currencies.',
      topPaidNote: 'top 10 per currency',
    },
  }),
  downloadSalaryReport: vi.fn(),
}));

describe('ReportsPage permissions', () => {
  it('hides export actions when reports:export is missing', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Salary Reports/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export excel/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/cannot export csv\/excel/i),
    ).toBeInTheDocument();
  });
});
