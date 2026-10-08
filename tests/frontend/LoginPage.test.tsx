import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoginPage } from '../../src/pages/LoginPage';
import { AuthProvider } from '../../src/context/AuthContext';
import { NotificationProvider } from '../../src/context/NotificationContext';

describe('LoginPage Component', () => {
  it('renders password access login form', () => {
    render(
      <NotificationProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </NotificationProvider>
    );

    expect(screen.getByText('TAX INVOICE TO STOCK')).toBeInTheDocument();
    expect(screen.getByLabelText(/System Access Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Stock Portal/i })).toBeInTheDocument();
  });
});
