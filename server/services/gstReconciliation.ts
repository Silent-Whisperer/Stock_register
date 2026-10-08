import { ExtractedTotals, ExtractedLineItem } from './validationService';

export interface GstReconciliationInput {
  taxableAmount: number;
  taxRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  roundingOff: number;
  grandTotal: number;
  isInterState: boolean;
  items: ExtractedLineItem[];
}

export interface ReconciledGstOutput {
  totals: ExtractedTotals;
  items: ExtractedLineItem[];
}

/**
 * Deterministic statutory rule engine for Indian GST compliance and reconciliation.
 * Mathematically reconciles taxable base, CGST, SGST, IGST, cess, and grand totals.
 *
 * @param input - Extracted raw numeric tokens and item lines.
 * @returns {ReconciledGstOutput} Mathematically audited totals and item fields.
 */
export function reconcileGstTaxation(input: GstReconciliationInput): ReconciledGstOutput {
  let {
    taxableAmount,
    taxRatePercent,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    roundingOff,
    grandTotal,
    isInterState,
    items,
  } = input;

  // 1. Infer Tax Rate if missing but amounts are present
  if (taxRatePercent <= 0 && taxableAmount > 0) {
    const totalTaxExtracted = cgstAmount + sgstAmount + igstAmount;
    if (totalTaxExtracted > 0) {
      taxRatePercent = Math.round((totalTaxExtracted / taxableAmount) * 100);
    }
  }

  // Default standard GST bracket if still 0 (18% is most common Indian B2B rate)
  if (taxRatePercent <= 0 && (cgstAmount > 0 || sgstAmount > 0 || igstAmount > 0)) {
    taxRatePercent = 18;
  }

  // 2. Derive Taxable Amount if missing from Taxes or Grand Total
  if (taxableAmount <= 0) {
    if (cgstAmount > 0 && sgstAmount > 0 && taxRatePercent > 0) {
      taxableAmount = Math.round(((cgstAmount + sgstAmount) / (taxRatePercent / 100)) * 100) / 100;
    } else if (igstAmount > 0 && taxRatePercent > 0) {
      taxableAmount = Math.round((igstAmount / (taxRatePercent / 100)) * 100) / 100;
    } else if (grandTotal > 0 && taxRatePercent > 0) {
      taxableAmount = Math.round((grandTotal / (1 + taxRatePercent / 100)) * 100) / 100;
    }
  }

  // 3. Reconcile Taxes from Taxable Amount & Rate
  if (taxableAmount > 0 && taxRatePercent > 0) {
    if (isInterState) {
      if (igstAmount <= 0) {
        igstAmount = Math.round(((taxableAmount * taxRatePercent) / 100) * 100) / 100;
      }
      cgstAmount = 0;
      sgstAmount = 0;
    } else {
      const halfRate = taxRatePercent / 2;
      const expectedCgst = Math.round(((taxableAmount * halfRate) / 100) * 100) / 100;
      const expectedSgst = Math.round(((taxableAmount * halfRate) / 100) * 100) / 100;

      if (cgstAmount <= 0) cgstAmount = expectedCgst;
      if (sgstAmount <= 0) sgstAmount = expectedSgst;

      // Symmetry check for intra-state GST
      if (cgstAmount > 0 && sgstAmount <= 0) sgstAmount = cgstAmount;
      if (sgstAmount > 0 && cgstAmount <= 0) cgstAmount = sgstAmount;
    }
  }

  // 4. Compute or Validate Grand Total
  const computedGross = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount + roundingOff;
  if (grandTotal <= 0) {
    grandTotal = Math.round(computedGross * 100) / 100;
  } else {
    // Round to 2 decimal places standard currency
    grandTotal = Math.round(grandTotal * 100) / 100;
  }

  // 5. Harmonize Line Items
  const reconciledItems = items.map((it) => {
    let q = it.quantity > 0 ? it.quantity : 1;
    let tVal = it.taxable_value;
    let uRate = it.unit_rate;
    let totAmt = it.total_amount;

    // If only 1 item and item taxable is 0 but invoice taxable is known
    if (items.length === 1 && tVal <= 0 && taxableAmount > 0) {
      tVal = taxableAmount;
    }

    // If taxable value is known and unit rate is missing or inclusive of tax
    if (tVal > 0 && q > 0) {
      if (uRate <= 0 || Math.abs(q * uRate - tVal) > 1) {
        uRate = Math.round((tVal / q) * 1000) / 1000;
      }
    } else if (uRate > 0 && tVal <= 0) {
      tVal = Math.round((q * uRate - (it.discount_amount || 0)) * 100) / 100;
    }

    let cRate = it.cgst_rate;
    let sRate = it.sgst_rate;
    let iRate = it.igst_rate;
    let cAmt = it.cgst_amount;
    let sAmt = it.sgst_amount;
    let iAmt = it.igst_amount;

    if (isInterState) {
      iRate = iRate > 0 ? iRate : taxRatePercent;
      iAmt = iAmt > 0 ? iAmt : Math.round(((tVal * iRate) / 100) * 100) / 100;
      cRate = 0;
      cAmt = 0;
      sRate = 0;
      sAmt = 0;
    } else {
      const halfRate = taxRatePercent > 0 ? taxRatePercent / 2 : 9;
      cRate = cRate > 0 ? cRate : halfRate;
      sRate = sRate > 0 ? sRate : halfRate;

      if (items.length === 1 && cgstAmount > 0) {
        cAmt = cgstAmount;
        sAmt = sgstAmount;
      } else {
        cAmt = cAmt > 0 ? cAmt : Math.round(((tVal * cRate) / 100) * 100) / 100;
        sAmt = sAmt > 0 ? sAmt : Math.round(((tVal * sRate) / 100) * 100) / 100;
      }
      iRate = 0;
      iAmt = 0;
    }

    if (totAmt <= 0) {
      totAmt = Math.round((tVal + cAmt + sAmt + iAmt) * 100) / 100;
    }

    return {
      ...it,
      quantity: q,
      unit_rate: uRate,
      taxable_value: tVal,
      cgst_rate: cRate,
      cgst_amount: cAmt,
      sgst_rate: sRate,
      sgst_amount: sAmt,
      igst_rate: iRate,
      igst_amount: iAmt,
      total_amount: totAmt,
    };
  });

  return {
    totals: {
      total_taxable: Math.round(taxableAmount * 100) / 100,
      total_cgst: Math.round(cgstAmount * 100) / 100,
      total_sgst: Math.round(sgstAmount * 100) / 100,
      total_igst: Math.round(igstAmount * 100) / 100,
      grand_total: grandTotal,
    },
    items: reconciledItems,
  };
}
