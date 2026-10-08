/**
 * Invoice extraction data structures for validation heuristics.
 */
export interface ExtractedLineItem {
  item_description: string;
  hsn_sac: string | null;
  quantity: number;
  unit: string;
  unit_rate: number;
  discount_amount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  confidence_score: number;
  flags: string[];
}

export interface ExtractedParty {
  name: string | null;
  gstin: string | null;
  address: string | null;
  state_code: string | null;
}

export interface ExtractedTotals {
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  grand_total: number;
}

export interface ExtractedInvoicePayload {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  supplier: ExtractedParty;
  buyer: ExtractedParty;
  items: ExtractedLineItem[];
  totals: ExtractedTotals;
  discrepancies: string[];
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validates Indian GSTIN format.
 * @param gstin GST Identification Number
 */
export function isValidGSTIN(gstin: string | null): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

/**
 * Extracts state code from GSTIN or party state.
 */
export function extractStateCode(gstin: string | null, fallbackStateCode: string | null): string | null {
  if (gstin && gstin.length >= 2) {
    const code = gstin.substring(0, 2);
    if (/^\d{2}$/.test(code)) return code;
  }
  return fallbackStateCode || null;
}

/**
 * Runs deterministic mathematical and domain heuristic audits on extracted invoice data.
 * Does not overwrite data; identifies calculation errors, GST rule violations, and missing required attributes.
 *
 * @param raw Raw extracted invoice payload
 * @returns Sanitized invoice payload with deterministic discrepancy flags
 */
export function validateAndAuditInvoice(raw: Partial<ExtractedInvoicePayload>): ExtractedInvoicePayload {
  const discrepancies: string[] = Array.isArray(raw.discrepancies) ? [...raw.discrepancies] : [];

  const supplier: ExtractedParty = {
    name: raw.supplier?.name || null,
    gstin: raw.supplier?.gstin ? raw.supplier.gstin.trim().toUpperCase() : null,
    address: raw.supplier?.address || null,
    state_code: raw.supplier?.state_code || null,
  };

  const buyer: ExtractedParty = {
    name: raw.buyer?.name || null,
    gstin: raw.buyer?.gstin ? raw.buyer.gstin.trim().toUpperCase() : null,
    address: raw.buyer?.address || null,
    state_code: raw.buyer?.state_code || null,
  };

  if (!supplier.name) {
    discrepancies.push('Missing supplier name in invoice.');
  }

  if (supplier.gstin && !isValidGSTIN(supplier.gstin)) {
    discrepancies.push(`Supplier GSTIN "${supplier.gstin}" has an invalid structure.`);
  }

  if (buyer.gstin && !isValidGSTIN(buyer.gstin)) {
    discrepancies.push(`Buyer GSTIN "${buyer.gstin}" has an invalid structure.`);
  }

  // Determine State Alignment for GST Rules
  const supplierState = extractStateCode(supplier.gstin, supplier.state_code);
  const buyerState = extractStateCode(buyer.gstin, buyer.state_code);
  const isInterState = supplierState && buyerState && supplierState !== buyerState;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  let calculatedTaxableTotal = 0;
  let calculatedCgstTotal = 0;
  let calculatedSgstTotal = 0;
  let calculatedIgstTotal = 0;
  let calculatedGrandTotal = 0;

  const auditedItems: ExtractedLineItem[] = rawItems.map((item, index) => {
    const itemFlags: string[] = Array.isArray(item.flags) ? [...item.flags] : [];
    const quantity = Number(item.quantity) || 1;
    const unitRate = Number(item.unit_rate) || 0;
    const discount = Number(item.discount_amount) || 0;
    const reportedTaxable = Number(item.taxable_value) || 0;

    const expectedTaxable = Math.round((quantity * unitRate - discount) * 100) / 100;
    if (Math.abs(reportedTaxable - expectedTaxable) > 0.1) {
      itemFlags.push(`Taxable mismatch: reported ${reportedTaxable}, expected ${expectedTaxable}`);
      discrepancies.push(`Item #${index + 1} taxable math mismatch: expected ${expectedTaxable}, got ${reportedTaxable}`);
    }

    const cgstAmount = Number(item.cgst_amount) || 0;
    const sgstAmount = Number(item.sgst_amount) || 0;
    const igstAmount = Number(item.igst_amount) || 0;
    const reportedTotal = Number(item.total_amount) || 0;

    const expectedTotal = Math.round((reportedTaxable + cgstAmount + sgstAmount + igstAmount) * 100) / 100;
    if (Math.abs(reportedTotal - expectedTotal) > 0.1) {
      itemFlags.push(`Total mismatch: reported ${reportedTotal}, expected ${expectedTotal}`);
      discrepancies.push(`Item #${index + 1} total math mismatch: expected ${expectedTotal}, got ${reportedTotal}`);
    }

    if (isInterState && (cgstAmount > 0 || sgstAmount > 0)) {
      itemFlags.push('Inter-state invoice should typically use IGST instead of CGST/SGST');
    }

    calculatedTaxableTotal += reportedTaxable;
    calculatedCgstTotal += cgstAmount;
    calculatedSgstTotal += sgstAmount;
    calculatedIgstTotal += igstAmount;
    calculatedGrandTotal += reportedTotal;

    return {
      item_description: item.item_description || `Item #${index + 1}`,
      hsn_sac: item.hsn_sac || null,
      quantity,
      unit: item.unit || 'PCS',
      unit_rate: unitRate,
      discount_amount: discount,
      taxable_value: reportedTaxable,
      cgst_rate: Number(item.cgst_rate) || 0,
      cgst_amount: cgstAmount,
      sgst_rate: Number(item.sgst_rate) || 0,
      sgst_amount: sgstAmount,
      igst_rate: Number(item.igst_rate) || 0,
      igst_amount: igstAmount,
      total_amount: reportedTotal,
      confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : 0.95,
      flags: itemFlags,
    };
  });

  const reportedGrandTotal = Number(raw.totals?.grand_total) || calculatedGrandTotal;
  if (Math.abs(reportedGrandTotal - calculatedGrandTotal) > 0.5) {
    discrepancies.push(`Grand total mismatch: sum of line items (${calculatedGrandTotal.toFixed(2)}) differs from header total (${reportedGrandTotal.toFixed(2)})`);
  }

  const totals: ExtractedTotals = {
    total_taxable: Math.round((Number(raw.totals?.total_taxable) || calculatedTaxableTotal) * 100) / 100,
    total_cgst: Math.round((Number(raw.totals?.total_cgst) || calculatedCgstTotal) * 100) / 100,
    total_sgst: Math.round((Number(raw.totals?.total_sgst) || calculatedSgstTotal) * 100) / 100,
    total_igst: Math.round((Number(raw.totals?.total_igst) || calculatedIgstTotal) * 100) / 100,
    grand_total: Math.round(reportedGrandTotal * 100) / 100,
  };

  return {
    invoice_number: raw.invoice_number || null,
    invoice_date: raw.invoice_date || new Date().toISOString().split('T')[0],
    due_date: raw.due_date || null,
    supplier,
    buyer,
    items: auditedItems,
    totals,
    discrepancies: Array.from(new Set(discrepancies)),
  };
}
