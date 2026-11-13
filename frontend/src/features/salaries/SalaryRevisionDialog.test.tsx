import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalaryRevisionDialog } from './SalaryRevisionDialog';

const reviseSalary = vi.fn();

vi.mock('../../services/salaries-service', () => ({
  reviseSalary: (...args: unknown[]) => reviseSalary(...args),
}));

describe('SalaryRevisionDialog', () => {
  beforeEach(() => {
    reviseSalary.mockReset();
  });

  it('validates required positive base salary before submit', async () => {
    const user = userEvent.setup();
    render(
      <SalaryRevisionDialog
        open
        employeeId="e1"
        current={null}
        onClose={() => undefined}
        onSaved={() => undefined}
      />,
    );

    const base = screen.getByLabelText(/base salary/i);
    await user.clear(base);
    await user.type(base, '0');
    await user.click(screen.getByRole('button', { name: /save revision/i }));

    expect(await screen.findByText(/number must be greater than 0|too small|invalid/i)).toBeTruthy();
    expect(reviseSalary).not.toHaveBeenCalled();
  });
});
