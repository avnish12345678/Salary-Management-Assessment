import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'hr.manager@acme.example',
      role: 'HR_MANAGER',
      isActive: true,
      employeeId: null,
      createdAt: '2024-01-15T00:00:00.000Z',
      permissions: ['employees:read', 'salaries:write', 'audit:read', 'dashboard:read'],
    },
    logout: vi.fn(),
  }),
}));

describe('SettingsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders redesigned profile, security, and permissions sections', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('hr.manager@acme.example')).toBeInTheDocument();
    expect(screen.getByText('HR Manager')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Workforce')).toBeInTheDocument();
    expect(screen.getByText('View employees')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
