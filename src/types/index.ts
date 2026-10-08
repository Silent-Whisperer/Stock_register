/**
 * Centralized Type Definitions for Invoice-to-Stock Management
 */

export type InvoiceStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'INWARD' | 'OUTWARD' | 'ADJUSTMENT';

/**
 * Supplier entity representing a vendor or billing supplier.
 */
export interface Supplier {
  id: string;
  name: string;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  state_code: string | null;
  created_at: string;
  updated_at: string;
  // Computed / aggregated attributes
  invoices_count?: number;
  total_spend?: number;
}

/**
 * Product catalog entity representing stock keeping units.
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  hsn_sac: string | null;
  unit: string;
  purchase_rate: number;
  selling_rate: number;
  current_stock: number;
  min_stock_alert: number;
  created_at: string;
  updated_at: string;
}

/**
 * Line item within an invoice.
 */
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
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
  confidence_score: number | null;
  flags: string[];
  created_at?: string;
  // UI helper for linked product
  product?: Product;
}

/**
 * Invoice entity representing a processed bill.
 */
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  supplier_id: string | null;
  supplier_name: string;
  supplier_gstin: string | null;
  buyer_name: string | null;
  buyer_gstin: string | null;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  grand_total: number;
  status: InvoiceStatus;
  file_url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  raw_extraction_json: any | null;
  discrepancies: string[];
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  items?: InvoiceItem[];
  supplier?: Supplier;
}

/**
 * Stock Transaction ledger record for audit trails.
 */
export interface StockTransaction {
  id: string;
  product_id: string;
  invoice_id: string | null;
  transaction_type: TransactionType;
  quantity: number;
  unit_price: number;
  balance_after: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined relation
  product?: Product;
  invoice?: Invoice;
}

/**
 * Pagination query parameters and state.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Stock register filter and sorting criteria.
 */
export interface StockRegisterFilters {
  searchQuery: string;
  lowStockOnly: boolean;
  sortBy: 'name' | 'sku' | 'current_stock' | 'purchase_rate' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

/**
 * Invoice filter criteria.
 */
export interface InvoiceFilters {
  status: 'ALL' | InvoiceStatus;
  searchQuery: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Extraction API response payload.
 */
export interface ExtractionResponse {
  success: boolean;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  data: {
    invoice_number: string | null;
    invoice_date: string | null;
    due_date: string | null;
    supplier: {
      name: string | null;
      gstin: string | null;
      address: string | null;
      state_code: string | null;
    };
    buyer: {
      name: string | null;
      gstin: string | null;
      address: string | null;
      state_code: string | null;
    };
    items: Array<Omit<InvoiceItem, 'id' | 'invoice_id' | 'product_id'>>;
    totals: {
      total_taxable: number;
      total_cgst: number;
      total_sgst: number;
      total_igst: number;
      grand_total: number;
    };
    discrepancies: string[];
  };
}

/**
 * Dashboard summary statistics.
 */
export interface DashboardStats {
  totalInvoices: number;
  pendingReviewCount: number;
  approvedCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalStockValuation: number;
}
