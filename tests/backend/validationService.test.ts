import { describe, it, expect } from 'vitest';
import {
  isValidGSTIN,
  validateAndAuditInvoice,
} from '../../server/services/validationService';

describe('GST Statutory and Math Validation Heuristics', () => {
  it('should validate Indian GSTIN format correctly', () => {
    expect(isValidGSTIN('27AABCA1234F1Z8')).toBe(true);
    expect(isValidGSTIN('07AABCG5678K1Z3')).toBe(true);
    expect(isValidGSTIN('INVALID_GSTIN')).toBe(false);
    expect(isValidGSTIN(null)).toBe(false);
  });

  it('should detect taxable and total math mismatches in line items', () => {
    const rawData = {
      invoice_number: 'INV-TEST-001',
      supplier: { name: 'Test Supplier', gstin: '27AABCA1234F1Z8' },
      items: [
        {
          item_description: 'Test Bolt',
          quantity: 10,
          unit_rate: 100,
          discount_amount: 0,
          taxable_value: 950, // Intentional mismatch: 10 * 100 = 1000, reported 950
          total_amount: 1120,
          cgst_amount: 85,
          sgst_amount: 85,
        },
      ],
      totals: { grand_total: 1120 },
    };

    const audited = validateAndAuditInvoice(rawData);
    expect(audited.discrepancies.length).toBeGreaterThan(0);
    expect(audited.discrepancies[0]).toContain('taxable math mismatch');
  });

  it('should pass cleanly for mathematically sound invoices', () => {
    const rawData = {
      invoice_number: 'INV-PERFECT-001',
      supplier: { name: 'Apex Ltd', gstin: '27AABCA1234F1Z8' },
      items: [
        {
          item_description: 'Industrial Fastener',
          quantity: 100,
          unit_rate: 50,
          discount_amount: 0,
          taxable_value: 5000,
          cgst_rate: 9,
          cgst_amount: 450,
          sgst_rate: 9,
          sgst_amount: 450,
          igst_rate: 0,
          igst_amount: 0,
          total_amount: 5900,
          confidence_score: 0.99,
          flags: [],
        },
      ],
      totals: { grand_total: 5900 },
    };

    const audited = validateAndAuditInvoice(rawData);
    expect(audited.discrepancies).toEqual([]);
    expect(audited.totals.grand_total).toBe(5900);
  });
});
