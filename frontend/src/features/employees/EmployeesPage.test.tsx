import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeesPage } from './EmployeesPage';

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    canWriteEmployees: true,
    canWriteSalaries: true,
    canReadSalaries: true,
    can: () => true,
  }),
}));

vi.mock('../../services/reference-service', () => ({
  fetchDepartments: vi.fn().mockResolvedValue([{ id: 'd1', code: 'ENG', name: 'Engineering', isActive: true }]),
  fetchCountries: vi.fn().mockResolvedValue([
    { id: 'c1', code: 'US', name: 'United States', currencyCode: 'USD' },
  ]),
  fetchDesignations: vi.fn().mockResolvedValue(['Engineer']),
}));

vi.mock('../../services/employees-service', () => ({
  fetchEmployees: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'e1',
        employeeCode: 'ACME-000001',
        firstName: 'Aisha',
        lastName: 'Patel',
        fullName: 'Aisha Patel',
        email: 'aisha.patel@acme.example',
        phone: null,
        departmentId: 'd1',
        department: { id: 'd1', code: 'ENG', name: 'Engineering' },
        designation: 'Engineer',
        countryId: 'c1',
        country: { id: 'c1', code: 'US', name: 'United States', currencyCode: 'USD' },
        city: 'SF',
        joiningDate: '2021-03-15',
        employmentStatus: 'ACTIVE',
        managerId: null,
        manager: null,
        currentSalary: {
          id: 's1',
          employeeId: 'e1',
          baseSalary: '100000.00',
          bonus: '0.00',
          allowances: '0.00',
          deductions: '0.00',
          grossSalary: '100000.00',
          netSalary: '100000.00',
          currency: 'USD',
          effectiveFrom: '2024-01-01',
          effectiveTo: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
  }),
  setEmployeeStatus: vi.fn(),
}));

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee table rows from the API', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <EmployeesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Aisha Patel')).toBeInTheDocument();
    expect(screen.getByText('ACME-000001')).toBeInTheDocument();
    expect(screen.getByText('aisha.patel@acme.example')).toBeInTheDocument();
  });
});
