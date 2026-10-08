import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClearInvoicesModal } from '../../src/components/invoices/ClearInvoicesModal';

describe('ClearInvoicesModal Component', () => {
  it('renders modal dialog and requires password confirmation', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn().mockImplementation(async (pwd: string) => {
      if (pwd !== '9090') {
        throw new Error('Incorrect security password.');
      }
    });

    const { rerender } = render(
      <ClearInvoicesModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Security Password/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/Security Password/i);
    const submitBtn = screen.getByRole('button', { name: /Confirm & Clear Invoices/i });

    // Try wrong password
    fireEvent.change(input, { target: { value: 'wrong-pass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Incorrect security password/i)).toBeInTheDocument();
    });

    // Try correct password 9090
    fireEvent.change(input, { target: { value: '9090' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith('9090');
    });
  });
});
