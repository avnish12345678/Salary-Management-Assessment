import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const loginMock = vi.fn();

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('shows validation errors for empty password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.clear(screen.getByLabelText(/password/i));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
