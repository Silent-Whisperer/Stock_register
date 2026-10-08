import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadPage } from '../../src/pages/UploadPage';
import { NotificationProvider } from '../../src/context/NotificationContext';

describe('UploadPage Component', () => {
  it('renders clean, focused upload workspace without marketing clutter', () => {
    const handleSuccess = vi.fn();

    render(
      <NotificationProvider>
        <UploadPage onExtractionSuccess={handleSuccess} />
      </NotificationProvider>
    );

    // Verify clean header
    expect(screen.getByRole('heading', { name: /Invoice Upload/i })).toBeInTheDocument();
    expect(screen.getByText('Upload a supplier invoice to extract and review its details.')).toBeInTheDocument();

    // Verify main upload workspace
    expect(screen.getByText('Upload a supplier invoice')).toBeInTheDocument();
    expect(screen.getByText(/PDF, JPG, PNG or WEBP · Maximum 15 MB/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose file/i })).toBeInTheDocument();

    // Verify removed marketing clutter & sidebar
    expect(screen.queryByText(/Fast OCR Engine/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Statutory GST Validator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Perpetual Stock Sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Automated Intake Pipeline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pending Verification/i)).not.toBeInTheDocument();
  });
});
