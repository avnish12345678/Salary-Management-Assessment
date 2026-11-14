import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('../../services/reference-service', () => ({
  fetchCountries: vi.fn().mockResolvedValue([
    { id: 'c1', code: 'US', name: 'United States', currencyCode: 'USD' },
  ]),
  fetchDepartments: vi.fn().mockResolvedValue([
    { id: 'd1', code: 'ENG', name: 'Engineering', isActive: true },
  ]),
}));

vi.mock('../../services/dashboard-service', () => ({
  fetchDashboardAnalytics: vi.fn().mockResolvedValue({
    kpis: {
      totalEmployees: 5,
      activeEmployees: 4,
      totalDepartments: 6,
      countriesCovered: 5,
      payrollByCurrency: [
        {
          currency: 'USD',
          totalAnnualPayroll: '145000.00',
          averageAnnualSalary: '145000.00',
          employeeCount: 1,
        },
      ],
    },
    charts: {
      countryPayroll: [],
      departmentPayroll: [],
      departmentAverageSalary: [],
      salaryHistogram: [],
      employeesByCountry: [{ country: 'United States', countryCode: 'US', count: 1 }],
      monthlyRevisionTrends: [],
    },
    notes: {
      annualBasis: 'annual',
      currencyPolicy: 'Financial amounts are never aggregated across currencies.',
    },
  }),
}));

describe('DashboardPage', () => {
  it('renders KPI cards from analytics API', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('Active Employees')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText(/Annual payroll by currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Trend')).toBeInTheDocument();
    expect(screen.getAllByText('Country-wise payroll').length).toBeGreaterThan(0);
  });
});
