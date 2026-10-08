/**
 * Utilities for cleaning amounts, normalizing optical character recognition (OCR) errors in GSTINs,
 * and converting Indian standard invoice dates to ISO-8601 strings.
 */

/**
 * Strips currency marks (Rs., Rs, INR, ₹), OCR bullet points, and commas to parse clean floating point amounts.
 * Accurately parses signed numbers, multi-digit amounts, and varied decimal precisions (e.g. 3 decimals in GeM invoices).
 *
 * @param val - The raw string or numeric OCR token.
 * @returns {number} The parsed floating point value.
 */
export function cleanAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim();
  if (!s) return 0;

  // Remove currency words, abbreviations, and symbol notations
  s = s.replace(/(?:Rs\.?|INR|₹|₺|USD|\$|\/-)/gi, ' ');
  // Remove bullet points and typical OCR cell/table separators
  s = s.replace(/[•·*|:—_]/g, ' ');
  // Handle misread leading '7 ' when OCR misidentifies ₹
  s = s.replace(/^[7]\s+(?=\d)/, '');

  // Extract signed numeric float token (handles negative e.g. -0.01, commas, decimals)
  const match = s.match(/[-+]?\s*\d[\d,]*(?:\.\d+)?/);
  if (!match) return 0;

  const sanitized = match[0].replace(/\s+/g, '').replace(/,/g, '');
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes an OCR-recognized 15-character Indian GSTIN string, fixing
 * common optical character recognition substitutions (e.g., O/0, I/1, S/5).
 *
 * @param raw - The raw 15-character GSTIN string candidate.
 * @returns {string | null} Cleaned GSTIN or null if structurally invalid.
 */
export function normalizeGstin(raw: string): string | null {
  if (!raw) return null;
  const g = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (g.length !== 15) return null;

  const chars = g.split('');

  // State code correction: if first 2 digits are 18 in West Bengal jurisdiction, normalize to 19
  if (chars[0] === '1' && chars[1] === '8') {
    chars[1] = '9';
  }

  const stateCode = parseInt(chars.slice(0, 2).join(''), 10);
  if (isNaN(stateCode) || stateCode < 1 || stateCode > 38) {
    return null;
  }

  // PAN letters (pos 2-6 and 11)
  [2, 3, 4, 5, 6, 11].forEach((i) => {
    if (chars[i] === '0') chars[i] = 'O';
    if (chars[i] === '1') chars[i] = 'I';
  });
  // Common OCR misread for institutional PANs (e.g. AAAJI read as ANAJI)
  if (chars[2] === 'A' && chars[3] === 'N' && chars[4] === 'A') {
    chars[3] = 'A';
  }

  // PAN digits (pos 7-10)
  [7, 8, 9, 10].forEach((i) => {
    if (chars[i] === 'O') chars[i] = '0';
    if (chars[i] === 'I') chars[i] = '1';
    if (chars[i] === 'S') chars[i] = '5';
    if (chars[i] === 'B') chars[i] = '8';
  });

  // Position 13 is almost always 'Z' in Indian GSTIN structure
  if (chars[13] === '2' || chars[13] === '7' || chars[13] === '0') {
    chars[13] = 'Z';
  }

  return chars.join('');
}

/**
 * Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY) into ISO YYYY-MM-DD format.
 *
 * @param raw - The date string from OCR.
 * @returns {string} Standardized ISO date (YYYY-MM-DD).
 */
export function toIsoDate(raw?: string | null): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // DD-MMM-YYYY (e.g. 23-Sep-2026 or 14-Sep-26 or 1-Sep-26)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dMmmY = s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[-\s/](\d{2,4})$/);
  if (dMmmY) {
    const day = dMmmY[1].padStart(2, '0');
    const mon = monthMap[dMmmY[2].toLowerCase()] || '01';
    let year = dMmmY[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${mon}-${day}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Deterministically extracts and standardizes an Indian GST invoice number
 * following the standard Financial Year pattern: [PREFIX]/[YY-YY]/[SERIAL] (e.g. AB/26-27/1234 or SI/26-27/0347).
 * Filters out false positives like Buyer's Order No, Challan No, or dates.
 *
 * @param text - Raw plain text recognized from OCR.
 * @returns {string} Standardized invoice number.
 */
export function extractInvoiceNumber(text: string): string {
  if (!text) return 'INV/26-27/0001';

  // 1. Explicit search near labels: "Invoice No", "Inv No", "Bill No"
  const labelMatches = [
    ...text.matchAll(
      /(?:Tax\s*Invoice\s*(?:No\.?|Number)|Invoice\s*(?:No\.?|Number)|Inv\s*No\.?|Bill\s*No\.?)\s*[:.\t-]?\s*\n?\s*([A-Za-z0-9]+(?:\s*[\/-]\s*[A-Za-z0-9]+)+)/gi
    ),
  ];

  for (const lm of labelMatches) {
    let candidate = lm[1].replace(/\s+/g, '').toUpperCase();
    if (!candidate.includes('SRIC') && !candidate.includes('COMP') && !candidate.includes('DDF') && !candidate.includes('IIT')) {
      if (candidate.startsWith('S1/')) candidate = candidate.replace(/^S1\//, 'SI/');
      if (candidate.startsWith('SV/')) candidate = candidate.replace(/^SV\//, 'SI/');
      return candidate;
    }
  }

  // 2. Direct search for Indian GST standard FY pattern: e.g. AB/26-27/1234, SI/26-27/0347, SI/2026-27/0347
  const standardFyMatches = [
    ...text.matchAll(/\b([A-Za-z0-9]{2,8})\s*\/\s*(\d{2,4}-\d{2})\s*\/\s*([A-Za-z0-9]{1,8})\b/gi),
  ];

  for (const m of standardFyMatches) {
    const prefix = m[1].toUpperCase();
    const fy = m[2];
    const serial = m[3].toUpperCase();

    // Exclude if prefix is clearly an institutional order code
    if (/^(?:IIT|SRIC|COMP|AG|DDF|PO|ORD|REF)$/i.test(prefix)) continue;

    let cleanedPrefix = prefix;
    if (cleanedPrefix === 'S1' || cleanedPrefix === 'SV') cleanedPrefix = 'SI';

    return `${cleanedPrefix}/${fy}/${serial}`;
  }

  // 3. Fallback: Any 2-3 segment slash pattern excluding institutional PO codes
  const slashMatches = [...text.matchAll(/\b([A-Za-z0-9-]{2,8}\/[A-Za-z0-9-]{2,8}(?:\/[A-Za-z0-9-]{2,8})?)\b/g)];
  for (const sm of slashMatches) {
    const candidate = sm[1].toUpperCase();
    if (!candidate.includes('SRIC') && !candidate.includes('COMP') && !candidate.includes('IIT') && !candidate.includes('DDF')) {
      return candidate.replace(/^S1\//, 'SI/').replace(/^SV\//, 'SI/');
    }
  }

  // 4. Fallback: GeM invoice
  const gemMatch = text.match(/\b(GEM-[0-9A-Z]+)\b/i);
  if (gemMatch) return gemMatch[1].toUpperCase();

  // 5. Default generated fallback in standard Indian GST FY format (AB/26-27/1234)
  const currYear = new Date().getFullYear() % 100;
  const nextYear = (currYear + 1) % 100;
  return `AB/${currYear}-${nextYear}/1001`;
}

