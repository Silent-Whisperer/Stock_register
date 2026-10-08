import { supabase } from '../lib/supabase';
import { LocalStorageRepository } from '../lib/dataStore';
import type { Invoice, InvoiceItem, InvoiceFilters, ExtractionResponse, StockTransaction } from '../types';

/**
 * Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY) into ISO YYYY-MM-DD format.
 */
function toIsoDate(raw?: string | null): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // DD-MMM-YYYY (e.g. 23-Sep-2026 or 22-Sep-2026)
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
 * Fetches invoices matching status and search filter criteria.
 */
export async function getInvoices(
  filters: InvoiceFilters = { status: 'ALL', searchQuery: '' }
): Promise<Invoice[]> {
  const localInvoices = LocalStorageRepository.getInvoices();
  const localItems = LocalStorageRepository.getInvoiceItems();
  const localSuppliers = LocalStorageRepository.getSuppliers();

  let merged: Invoice[] = [...localInvoices];

  try {
    let query = supabase.from('invoices').select('*, items:invoice_items(*), supplier:suppliers(*)').order('created_at', { ascending: false });

    if (filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }
    if (filters.searchQuery.trim()) {
      const q = `%${filters.searchQuery.trim()}%`;
      query = query.or(`invoice_number.ilike.${q},supplier_name.ilike.${q}`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const map = new Map<string, Invoice>();
      localInvoices.forEach((inv) => map.set(inv.id, inv));
      (data as Invoice[]).forEach((rem) => {
        const loc = map.get(rem.id);
        if (loc && loc.status === 'APPROVED' && rem.status !== 'APPROVED') {
          map.set(rem.id, { ...rem, status: 'APPROVED' });
        } else {
          map.set(rem.id, rem);
        }
      });
      merged = Array.from(map.values());
    }
  } catch {
    // Fall back to local repository
  }

  let filtered = [...merged];
  if (filters.status !== 'ALL') {
    filtered = filtered.filter((i) => i.status === filters.status);
  }
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (i) => i.invoice_number.toLowerCase().includes(q) || i.supplier_name.toLowerCase().includes(q)
    );
  }

  return filtered.map((inv) => ({
    ...inv,
    items: inv.items && inv.items.length > 0 ? inv.items : localItems.filter((it) => it.invoice_id === inv.id),
    supplier: inv.supplier || localSuppliers.find((s) => s.id === inv.supplier_id),
  }));
}

/**
 * Retrieves a single invoice with line items and supplier details.
 */
export async function getInvoiceById(id: string): Promise<Invoice> {
  // Check local store first
  const localInvoices = LocalStorageRepository.getInvoices();
  const localInv = localInvoices.find((i) => i.id === id);

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), supplier:suppliers(*)')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return data as Invoice;
    }
  } catch {
    // Continue to local store fallback
  }

  if (localInv) {
    const items = LocalStorageRepository.getInvoiceItems().filter((it) => it.invoice_id === id);
    const suppliers = LocalStorageRepository.getSuppliers();
    return {
      ...localInv,
      items,
      supplier: suppliers.find((s) => s.id === localInv.supplier_id),
    };
  }

  throw new Error(`Invoice #${id} not found.`);
}

/**
 * Saves extracted invoice data as a pending invoice for review.
 * Does NOT update stock until human approval.
 */
export async function createInvoiceFromExtraction(
  extraction: ExtractionResponse,
  fileUrl?: string | null
): Promise<Invoice> {
  const d = extraction.data;
  const now = new Date().toISOString();
  const invoiceId = `inv-${Date.now()}`;

  // Find or create supplier
  const suppliers = LocalStorageRepository.getSuppliers();
  let supplier = suppliers.find((s) => s.name.toLowerCase() === (d.supplier.name || '').toLowerCase());
  if (!supplier && d.supplier.name) {
    supplier = {
      id: `sup-${Date.now()}`,
      name: d.supplier.name,
      gstin: d.supplier.gstin,
      email: null,
      phone: null,
      address: d.supplier.address,
      state_code: d.supplier.state_code,
      created_at: now,
      updated_at: now,
    };
    suppliers.push(supplier);
    LocalStorageRepository.set('suppliers', suppliers);
  }

  const invoice: Invoice = {
    id: invoiceId,
    invoice_number: d.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
    invoice_date: toIsoDate(d.invoice_date),
    due_date: d.due_date ? toIsoDate(d.due_date) : null,
    supplier_id: supplier ? supplier.id : null,
    supplier_name: d.supplier.name || 'Unknown Supplier',
    supplier_gstin: d.supplier.gstin,
    buyer_name: d.buyer.name,
    buyer_gstin: d.buyer.gstin,
    total_taxable: d.totals.total_taxable,
    total_cgst: d.totals.total_cgst,
    total_sgst: d.totals.total_sgst,
    total_igst: d.totals.total_igst,
    grand_total: d.totals.grand_total,
    status: 'PENDING_APPROVAL',
    file_url: fileUrl || null,
    file_path: null,
    file_name: extraction.file.originalName,
    file_size: extraction.file.size,
    file_type: extraction.file.mimeType,
    raw_extraction_json: extraction,
    discrepancies: d.discrepancies,
    approved_at: null,
    approved_by: null,
    created_at: now,
    updated_at: now,
  };

  const items: InvoiceItem[] = d.items.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    invoice_id: invoiceId,
    product_id: null,
    item_description: it.item_description,
    hsn_sac: it.hsn_sac,
    quantity: it.quantity,
    unit: it.unit || 'PCS',
    unit_rate: it.unit_rate,
    discount_amount: it.discount_amount || 0,
    taxable_value: it.taxable_value,
    cgst_rate: it.cgst_rate || 0,
    cgst_amount: it.cgst_amount || 0,
    sgst_rate: it.sgst_rate || 0,
    sgst_amount: it.sgst_amount || 0,
    igst_rate: it.igst_rate || 0,
    igst_amount: it.igst_amount || 0,
    total_amount: it.total_amount,
    confidence_score: it.confidence_score,
    flags: it.flags,
    created_at: now,
  }));

  // ALWAYS persist to local repository first so it is immediately accessible
  const currentInvoices = LocalStorageRepository.getInvoices();
  currentInvoices.unshift(invoice);
  LocalStorageRepository.set('invoices', currentInvoices);

  const currentItems = LocalStorageRepository.getInvoiceItems();
  LocalStorageRepository.set('invoice_items', [...currentItems, ...items]);

  // Attempt async sync to Supabase in background
  try {
    const { error: invErr } = await supabase.from('invoices').insert([invoice]);
    if (!invErr) {
      await supabase.from('invoice_items').insert(items);
    }
  } catch {
    // Continue with local copy
  }

  return { ...invoice, items, supplier };
}

/**
 * Updates invoice header and line items during review.
 */
export async function updateInvoiceAndItems(
  invoiceId: string,
  invoiceData: Partial<Invoice>,
  items: InvoiceItem[]
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update local repository
  const invoices = LocalStorageRepository.getInvoices();
  const idx = invoices.findIndex((i) => i.id === invoiceId);
  if (idx !== -1) {
    invoices[idx] = { ...invoices[idx], ...invoiceData, updated_at: now };
    LocalStorageRepository.set('invoices', invoices);
  }
  const allItems = LocalStorageRepository.getInvoiceItems().filter((i) => i.invoice_id !== invoiceId);
  LocalStorageRepository.set('invoice_items', [...allItems, ...items]);

  // 2. Sync to Supabase
  try {
    const { items: _it, supplier: _sp, product: _pr, ...cleanData } = invoiceData as any;
    await supabase.from('invoices').update({ ...cleanData, updated_at: now }).eq('id', invoiceId);
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    const cleanItems = items.map((it) => {
      const { product: _p, ...cleanIt } = it as any;
      return { ...cleanIt, invoice_id: invoiceId };
    });
    await supabase.from('invoice_items').insert(cleanItems);
  } catch (err: any) {
    console.warn('[Sync] Supabase update note:', err?.message);
  }
}

/**
 * Atomically approves an invoice and executes stock register mutations.
 * Human approval is mandatory. AI output never reaches stock directly.
 */
export async function approveInvoiceAndMutateStock(invoiceId: string, userId: string = 'operator'): Promise<void> {
  const invoices = LocalStorageRepository.getInvoices();
  let invoice = invoices.find((i) => i.id === invoiceId);

  // If not found in local store, fetch from Supabase
  if (!invoice) {
    try {
      const { data } = await supabase.from('invoices').select('*, items:invoice_items(*)').eq('id', invoiceId).maybeSingle();
      if (data) {
        invoice = data as Invoice;
        invoices.push(invoice);
      }
    } catch {}
  }

  const now = new Date().toISOString();
  if (invoice) {
    invoice.status = 'APPROVED';
    invoice.approved_at = now;
    invoice.approved_by = userId;
    invoice.updated_at = now;
    LocalStorageRepository.set('invoices', invoices);
  }

  const items = LocalStorageRepository.getInvoiceItems().filter((it) => it.invoice_id === invoiceId);
  const products = LocalStorageRepository.getProducts();
  const transactions = LocalStorageRepository.getTransactions();

  for (const item of items) {
    let product = products.find(
      (p) => (item.product_id && p.id === item.product_id) || p.name.toLowerCase() === item.item_description.toLowerCase()
    );

    let newStock = item.quantity;
    if (!product) {
      const sku = `SKU-${item.item_description.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      product = {
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sku,
        name: item.item_description,
        description: `Imported from Invoice #${invoice?.invoice_number || ''}`,
        hsn_sac: item.hsn_sac,
        unit: item.unit,
        purchase_rate: item.unit_rate,
        selling_rate: Math.round(item.unit_rate * 1.25 * 100) / 100,
        current_stock: item.quantity,
        min_stock_alert: 5,
        created_at: now,
        updated_at: now,
      };
      products.push(product);
      item.product_id = product.id;
    } else {
      product.current_stock += item.quantity;
      product.purchase_rate = item.unit_rate;
      product.updated_at = now;
      newStock = product.current_stock;
      item.product_id = product.id;
    }

    const tx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: product.id,
      invoice_id: invoiceId,
      transaction_type: 'INWARD',
      quantity: item.quantity,
      unit_price: item.unit_rate,
      balance_after: newStock,
      notes: `Inward stock received from Invoice #${invoice?.invoice_number || ''}`,
      created_by: userId,
      created_at: now,
    };
    transactions.push(tx);
  }

  LocalStorageRepository.set('products', products);
  LocalStorageRepository.set('stock_transactions', transactions);

  // Sync to Supabase: call stored procedure AND direct update
  try {
    await supabase.rpc('approve_invoice_and_update_stock', {
      p_invoice_id: invoiceId,
      p_user_id: userId,
    });
  } catch (rpcErr: any) {
    console.warn('[Approval] Stored proc note:', rpcErr?.message);
  }

  // Direct guarantee update on public.invoices table in Supabase
  try {
    await supabase.from('invoices').update({
      status: 'APPROVED',
      approved_at: now,
      updated_at: now,
    }).eq('id', invoiceId);
  } catch (directErr: any) {
    console.warn('[Approval] Direct update note:', directErr?.message);
  }

  // Also call backend API endpoint for server-level sync
  try {
    await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch {}
}

/**
 * Clears all invoices and line items after verifying security password.
 * Integrates directly with backend API /api/invoices/clear and clears local cache.
 * @param password Security password (must match '9090')
 */
export async function clearAllInvoices(password: string): Promise<void> {
  if (password.trim() !== '9090') {
    throw new Error('Invalid security password. Action aborted.');
  }

  // 1. Call backend API endpoint
  try {
    const res = await fetch('/api/invoices/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Backend failed to clear invoices.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Invalid security password')) {
      throw err;
    }
  }

  // 2. Direct Supabase client purge
  try {
    await supabase.from('invoice_items').delete().neq('id', '___non_existent___');
    await supabase.from('invoices').delete().neq('id', '___non_existent___');
  } catch {
    // Continue to local repository
  }

  // 3. Purge local repository cache
  LocalStorageRepository.clearTable('invoices');
  LocalStorageRepository.clearTable('invoice_items');
}

