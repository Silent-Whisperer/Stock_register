import { describe, it, expect } from 'vitest';
import { cleanAmount, normalizeGstin } from '../../server/services/ocrFormatters';
import { reconcileGstTaxation } from '../../server/services/gstReconciliation';
import { parseInvoiceWithHeuristics } from '../../server/services/heuristicOcrParser';

describe('GST Extraction and Mathematical Reconciliation', () => {
  it('should clean all Indian currency notations, negative amounts, and 3-decimal currencies', () => {
    expect(cleanAmount('Rs. 39498.84')).toBe(39498.84);
    expect(cleanAmount('Rs. 3554.900')).toBe(3554.9);
    expect(cleanAmount('Rs. 5826.079')).toBe(5826.079);
    expect(cleanAmount('Rs. 46608.632')).toBe(46608.632);
    expect(cleanAmount('Rs. -0.01')).toBe(-0.01);
    expect(cleanAmount('₹ 3,554.90')).toBe(3554.9);
    expect(cleanAmount('39,498.84')).toBe(39498.84);
    expect(cleanAmount('3,80,000.00')).toBe(380000);
    expect(cleanAmount('Tax Rate (%) 18')).toBe(18);
  });

  it('should normalize OCR misreads in 15-character GSTINs', () => {
    expect(normalizeGstin('19AAAJI0323G1ZM')).toBe('19AAAJI0323G1ZM');
    expect(normalizeGstin('18ANAJI0323G1ZM')).toBe('19AAAJI0323G1ZM');
    expect(normalizeGstin('19AAEFJ0438R1ZV')).toBe('19AAEFJ0438R1ZV');
  });

  it('should reconcile statutory GST intra-state math flawlessly', () => {
    const reconciled = reconcileGstTaxation({
      taxableAmount: 39498.84,
      taxRatePercent: 18,
      cgstAmount: 3554.9,
      sgstAmount: 3554.9,
      igstAmount: 0,
      cessAmount: 0,
      roundingOff: -0.01,
      grandTotal: 46608.63,
      isInterState: false,
      items: [
        {
          item_description: 'hp OEM Toner Cartridge',
          hsn_sac: '8443',
          quantity: 8,
          unit: 'PIECES',
          unit_rate: 0,
          discount_amount: 0,
          taxable_value: 39498.84,
          cgst_rate: 0,
          cgst_amount: 0,
          sgst_rate: 0,
          sgst_amount: 0,
          igst_rate: 0,
          igst_amount: 0,
          total_amount: 46608.63,
          confidence_score: 0.98,
          flags: [],
        },
      ],
    });

    expect(reconciled.totals.total_taxable).toBe(39498.84);
    expect(reconciled.totals.total_cgst).toBe(3554.9);
    expect(reconciled.totals.total_sgst).toBe(3554.9);
    expect(reconciled.totals.grand_total).toBe(46608.63);
    expect(reconciled.items[0].cgst_rate).toBe(9);
    expect(reconciled.items[0].sgst_rate).toBe(9);
    expect(reconciled.items[0].cgst_amount).toBe(3554.9);
    expect(reconciled.items[0].sgst_amount).toBe(3554.9);
    expect(reconciled.items[0].unit_rate).toBeCloseTo(4937.355, 2);
  });

  it('should extract all crucial fields from GeM tax invoice OCR text', () => {
    const ocrText = `
TAX INVOICE
GeM Government e Marketplace
Invoice No: GEM-29104812 Date: 23-Sep-2026
Supplier: HP India Sales Private Limited
GSTIN: 19AAAJI0323G1ZM
Buyer: SRIC, 2ND FLOOR, ADMINISTRATIVE BUILDING, IIT KHARAGPUR
GSTIN: 19AAEFJ0438R1ZV

Product Description\tHSN Code\tMeasurement Unit\tGST UQ Name\tSupplied Qty\tUnit Price\tTotal Price inclusive of Taxes
hp OEM Toner Cartridge Manufactured by HP India Sales Private Limited\t8443\tpieces\tPIECES\t8\tRs. 5826.079\tRs. 46608.632

Taxable Amount\tRs. 39498.84
Tax Rate (%)\t18
CGST\tRs. 3554.900
SGST/UTGST\tRs. 3554.900
Cess Rate (%)\t0.00
Cess Amount\tRs. 0.00
Cess in Quantum\tRs. 0.00
Rounding Off\tRs. -0.01
Total Price inclusive of Taxes\tRs. 46608.632
`;

    const extracted = parseInvoiceWithHeuristics(ocrText, 'gem_invoice.jpg');

    expect(extracted.supplier.gstin).toBe('19AAAJI0323G1ZM');
    expect(extracted.buyer.gstin).toBe('19AAEFJ0438R1ZV');
    expect(extracted.totals.total_taxable).toBe(39498.84);
    expect(extracted.totals.total_cgst).toBe(3554.9);
    expect(extracted.totals.total_sgst).toBe(3554.9);
    expect(extracted.totals.total_igst).toBe(0);
    expect(extracted.totals.grand_total).toBe(46608.63);

    expect(extracted.items.length).toBe(1);
    expect(extracted.items[0].item_description).toContain('hp OEM Toner Cartridge');
    expect(extracted.items[0].hsn_sac).toBe('8443');
    expect(extracted.items[0].quantity).toBe(8);
    expect(extracted.items[0].taxable_value).toBe(39498.84);
    expect(extracted.items[0].cgst_amount).toBe(3554.9);
    expect(extracted.items[0].sgst_amount).toBe(3554.9);
    expect(extracted.discrepancies).toEqual([]);
  });

  it('should extract workstation challan invoice with % discovery and Indian lakh format', () => {
    const ocrSupreme = `(ORIGINAL FOR RECIPIENT)	
TAX INVOICE CUM CHALLAN	e-Way Gil No. Dated	
Invoice No.	Moder fee of Payment	
SV26-27/0347	
Buyer's Order No.	ISSMIT/SRIC/COMP-J1/AG/DOF/2028 1-Sep-26	
Delivery Note Date	
Buyer (Bil to)	
THE HEAD	DEPARTMENT OF AG & FE	Dispatched through	Destination	
IT KHARAGPUR	
KHARAGPUR	18ANAJI0323G1ZM	
GSTIN/UIN	West Bengal, Code: 19	
State Name	
Rate	per	
HSN/SAC	Quantity	
1 PCS 3,80,000.00 PCS	3,80,000.00	
8471	
WORKSTATION WITHOUT OS	INTEL ULTRA 9-285 PROCESSOR (5.8 GHz, 24 CORE)	
64 GB DDRS (5600 MHZ) NON ECC MEMORY, RTX-A 1000	GRAPHICS CARD WITH 8 GB MEMORY /1 TB SSD/	
KEY BOARD / OPTICAL MOUSE / 24 INCH MONITOR/	
MAKE : HP, MODEL: 22 G9	
S/N. =4CE620BRXQ.	
WARRANTY: 3 YEARS ONSITE	34,200.00	
eVEr SGST (STATE TAX) 118 e	CGST (CENTRAL TAX)	34,200.00	
cilot obl	
pon boo	1 8 Inor	
· 4,48,400.00	
Total	1 PCS	E. & O.E	
Amount Chargeable (in words)	INR Four Lakh Forty Eight Thousand Four Hundred Only	CGST	SGST/UTGST	Total	
Taxable	Rate	Amount	Tax Amount	
HSN/SAC	Value	Rate	Amount	9%	34,200.00	68,400.00	
3,80,000.00	9%	34.200.00	34,200.00	34,200.00	68,400.00	
8471	Total	3,80,000.00	
Tax Amount (in words) : INR Sixty Eight Thousand Four Hundred Only	
Company's Bank Details	SUPREME INFOTECH	
A/c Holder's Name	PUNJAB NATIONAL BANK	
Bank Name	
3872008700000337	
Branch & IFS Code: IIT, KHARAGPUR & PUNB0387200	
A/c No.	
SWIFT Code	for SUPREME INFOTECH	
Company's PAN	: AHHPD6722G	
Declaration	Authorised Signatory	
We declare that this invoice shows the actual price of the goods	
described and that all particulars are true and correct.	SUBJECT TO MIDNAPORE JURISDICTION	
This is a Computer Generated Invoice`;

    const res = parseInvoiceWithHeuristics(ocrSupreme, 'supreme.png');

    expect(res.supplier.name).toBe('SUPREME INFOTECH');
    expect(res.supplier.gstin).toBe('19AHHPD6722G1ZF');
    expect(res.buyer.name).toContain('THE HEAD');
    expect(res.buyer.gstin).toBe('19AAAJI0323G1ZM');

    expect(res.totals.total_taxable).toBe(380000);
    expect(res.totals.total_cgst).toBe(34200);
    expect(res.totals.total_sgst).toBe(34200);
    expect(res.totals.total_igst).toBe(0);
    expect(res.totals.grand_total).toBe(448400);

    expect(res.items.length).toBe(1);
    expect(res.items[0].item_description).toBe('WORKSTATION WITHOUT OS');
    expect(res.items[0].hsn_sac).toBe('8471');
    expect(res.items[0].quantity).toBe(1);
    expect(res.items[0].unit).toBe('PCS');
    expect(res.items[0].unit_rate).toBe(380000);
    expect(res.items[0].taxable_value).toBe(380000);
    expect(res.items[0].cgst_rate).toBe(9);
    expect(res.items[0].cgst_amount).toBe(34200);
    expect(res.items[0].sgst_rate).toBe(9);
    expect(res.items[0].sgst_amount).toBe(34200);
    expect(res.items[0].total_amount).toBe(448400);
    expect(res.discrepancies).toEqual([]);
  });
});
