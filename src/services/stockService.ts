import { supabase } from '../lib/supabase';
import { LocalStorageRepository } from '../lib/dataStore';
import type { Product, PaginatedResult, StockRegisterFilters, StockTransaction } from '../types';

/**
 * Fetches paginated stock records matching filter and sorting criteria.
 * Enforces server/slice limits (e.g. 50 rows per page) to ensure optimal performance.
 *
 * @param page 1-indexed page number
 * @param pageSize Number of rows per page (defaults to 50)
 * @param filters Search, low stock, and sorting filters
 * @returns Promise<PaginatedResult<Product>>
 */
export async function getStockRegister(
  page: number = 1,
  pageSize: number = 50,
  filters: StockRegisterFilters = {
    searchQuery: '',
    lowStockOnly: false,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  }
): Promise<PaginatedResult<Product>> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (filters.searchQuery.trim()) {
      const q = `%${filters.searchQuery.trim()}%`;
      query = query.or(`name.ilike.${q},sku.ilike.${q},hsn_sac.ilike.${q}`);
    }

    if (filters.lowStockOnly) {
      // Products where current_stock <= min_stock_alert
      query = query.filter('current_stock', 'lte', 'min_stock_alert');
    }

    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error || !data) {
      throw error || new Error('No data returned');
    }

    return {
      data: data as Product[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize) || 1,
    };
  } catch {
    // Resilient local store query
    let all = LocalStorageRepository.getProducts();

    if (filters.searchQuery.trim()) {
      const term = filters.searchQuery.toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.hsn_sac && p.hsn_sac.toLowerCase().includes(term))
      );
    }

    if (filters.lowStockOnly) {
      all = all.filter((p) => p.current_stock <= p.min_stock_alert);
    }

    all.sort((a, b) => {
      let valA: any = a[filters.sortBy];
      let valB: any = b[filters.sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = all.length;
    const from = (page - 1) * pageSize;
    const paginated = all.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}

/**
 * Updates a product's details directly from the stock register.
 *
 * @param id Product ID
 * @param updates Partial product fields to update
 * @returns Promise<Product>
 */
export async function updateProductStockDetails(
  id: string,
  updates: Partial<Product>
): Promise<Product> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
    if (error || !data) throw error;
    return data as Product;
  } catch {
    const products = LocalStorageRepository.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');
    const updated = { ...products[index], ...payload };
    products[index] = updated;
    LocalStorageRepository.set('products', products);
    return updated;
  }
}

/**
 * Fetches transaction history for a specific product.
 *
 * @param productId Product UUID
 * @returns Promise<StockTransaction[]>
 */
export async function getProductStockTransactions(productId: string): Promise<StockTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*, invoice:invoices(invoice_number, invoice_date, supplier_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !data) throw error;
    return data as StockTransaction[];
  } catch {
    const txs = LocalStorageRepository.getTransactions();
    const invoices = LocalStorageRepository.getInvoices();
    return txs
      .filter((t) => t.product_id === productId)
      .map((t) => ({
        ...t,
        invoice: invoices.find((inv) => inv.id === t.invoice_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

/**
 * Deletes a stock item and its associated audit transactions.
 * @param id Product ID
 */
export async function deleteStockItem(id: string): Promise<void> {
  try {
    await supabase.from('stock_transactions').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.deleteItem<Product>('products', id);
  const txs = LocalStorageRepository.getTransactions().filter((t) => t.product_id !== id);
  LocalStorageRepository.set('stock_transactions', txs);
}

/**
 * Clears all stock inventory and transaction ledgers.
 */
export async function clearAllStock(): Promise<void> {
  try {
    await supabase.from('stock_transactions').delete().neq('id', '___non_existent___');
    await supabase.from('products').delete().neq('id', '___non_existent___');
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.clearTable('products');
  LocalStorageRepository.clearTable('stock_transactions');
}
