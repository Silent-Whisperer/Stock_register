import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StockRegisterTable } from '../../src/components/stock/StockRegisterTable';
import type { Product } from '../../src/types';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-BOLT-M8',
    name: 'Industrial Bolt M8',
    description: 'High tensile hex bolt',
    hsn_sac: '7318',
    unit: 'PCS',
    purchase_rate: 12.5,
    selling_rate: 16.0,
    current_stock: 500,
    min_stock_alert: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('StockRegisterTable Component', () => {
  it('renders spreadsheet-like table headers and stock items', () => {
    const handleSave = vi.fn();
    const handlePageChange = vi.fn();

    render(
      <StockRegisterTable
        products={mockProducts}
        totalItems={1}
        currentPage={1}
        pageSize={50}
        totalPages={1}
        loading={false}
        onPageChange={handlePageChange}
        onSaveRow={handleSave}
      />
    );

    expect(screen.getByText('SKU-BOLT-M8')).toBeInTheDocument();
    expect(screen.getByText('Industrial Bolt M8')).toBeInTheDocument();
    expect(screen.getByText(/records/i)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
  });
});
