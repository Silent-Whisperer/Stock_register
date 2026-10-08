import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LineItemsTable } from '../../src/components/review/LineItemsTable';
import type { InvoiceItem } from '../../src/types';

const mockItems: InvoiceItem[] = [
  {
    id: 'item-1',
    invoice_id: 'inv-101',
    product_id: null,
    item_description: 'Precision Stainless Washer',
    hsn_sac: '7318',
    quantity: 200,
    unit: 'PCS',
    unit_rate: 5.0,
    discount_amount: 0,
    taxable_value: 1000,
    cgst_rate: 9,
    cgst_amount: 90,
    sgst_rate: 9,
    sgst_amount: 90,
    igst_rate: 0,
    igst_amount: 0,
    total_amount: 1180,
    confidence_score: 0.98,
    flags: [],
  },
];

describe('LineItemsTable Component', () => {
  it('renders line items and allows adding items when editable', () => {
    const handleItemChange = vi.fn();
    const handleAddItem = vi.fn();
    const handleRemoveItem = vi.fn();

    render(
      <LineItemsTable
        items={mockItems}
        isReadOnly={false}
        onItemChange={handleItemChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
      />
    );

    expect(screen.getByDisplayValue('Precision Stainless Washer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7318')).toBeInTheDocument();
    expect(screen.getByText('Add Line Item')).toBeInTheDocument();
  });
});
