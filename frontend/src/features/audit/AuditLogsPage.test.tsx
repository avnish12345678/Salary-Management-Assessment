import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { AuditLogsPage } from './AuditLogsPage';

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => false,
    canWriteEmployees: false,
    canWriteSalaries: false,
    canReadSalaries: true,
  }),
}));

describe('AuditLogsPage', () => {
  it('blocks users without audit:read', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AuditLogsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/does not have permission to view audit logs/i)).toBeInTheDocument();
  });
});
