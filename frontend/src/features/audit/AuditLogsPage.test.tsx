import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsPage } from './AuditLogsPage';

const fetchAuditLogs = vi.fn();

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('../../services/audit-service', () => ({
  fetchAuditLogs: (...args: unknown[]) => fetchAuditLogs(...args),
}));

import { usePermissions } from '../../hooks/usePermissions';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuditLogsPage />
    </QueryClientProvider>,
  );
}

describe('AuditLogsPage', () => {
  beforeEach(() => {
    fetchAuditLogs.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('blocks users without audit:read', () => {
    vi.mocked(usePermissions).mockReturnValue({
      can: () => false,
      canWriteEmployees: false,
      canWriteSalaries: false,
      canReadSalaries: true,
    } as ReturnType<typeof usePermissions>);

    renderPage();

    expect(screen.getByText(/does not have permission to view audit logs/i)).toBeInTheDocument();
  });

  it('renders redesigned header and empty state', async () => {
    vi.mocked(usePermissions).mockReturnValue({
      can: () => true,
      canWriteEmployees: false,
      canWriteSalaries: false,
      canReadSalaries: true,
    } as ReturnType<typeof usePermissions>);

    fetchAuditLogs.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText(/No audit activity yet/i)).toBeInTheDocument();
    expect(screen.getByText('Matching events')).toBeInTheDocument();
  });

  it('renders audit event rows with friendly action labels', async () => {
    vi.mocked(usePermissions).mockReturnValue({
      can: () => true,
      canWriteEmployees: false,
      canWriteSalaries: false,
      canReadSalaries: true,
    } as ReturnType<typeof usePermissions>);

    fetchAuditLogs.mockResolvedValue({
      items: [
        {
          id: 'evt-1',
          action: 'EMPLOYEE_DEACTIVATE',
          entityType: 'employee',
          entityId: 'a0000000-0000-4000-8000-0000000f51e1',
          beforeJson: { employmentStatus: 'ACTIVE' },
          afterJson: { employmentStatus: 'INACTIVE' },
          ipAddress: '::1',
          createdAt: new Date().toISOString(),
          actor: {
            id: 'user-1',
            email: 'hr.manager@acme.example',
            role: 'HR_MANAGER',
          },
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText('Employee deactivated')).toBeInTheDocument();
    expect(screen.getByText('hr.manager@acme.example')).toBeInTheDocument();
    expect(screen.getByText('Matching events')).toBeInTheDocument();
  });
});
