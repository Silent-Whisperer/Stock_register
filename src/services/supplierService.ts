import { supabase } from '../lib/supabase';
import { LocalStorageRepository } from '../lib/dataStore';
import type { Supplier } from '../types';

/**
 * Retrieves suppliers with aggregated invoice volume.
 * @returns Promise<Supplier[]>
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (error || !data) throw error;
    return data as Supplier[];
  } catch {
    const suppliers = LocalStorageRepository.getSuppliers();
    const invoices = LocalStorageRepository.getInvoices();

    return suppliers.map((sup) => {
      const supInvoices = invoices.filter((i) => i.supplier_id === sup.id || i.supplier_name === sup.name);
      const totalSpend = supInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      return {
        ...sup,
        invoices_count: supInvoices.length,
        total_spend: totalSpend,
      };
    });
  }
}

/**
 * Creates a new supplier in the directory.
 * @param supplier Supplier payload
 * @returns Promise<Supplier>
 */
export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  const now = new Date().toISOString();
  const newSupplier: Supplier = {
    ...supplier,
    id: `sup-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase.from('suppliers').insert([newSupplier]).select().single();
    if (error || !data) throw error;
    return data as Supplier;
  } catch {
    const list = LocalStorageRepository.getSuppliers();
    list.unshift(newSupplier);
    LocalStorageRepository.set('suppliers', list);
    return newSupplier;
  }
}

/**
 * Updates an existing supplier.
 * @param id Supplier ID
 * @param updates Partial supplier data
 * @returns Promise<Supplier>
 */
export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase.from('suppliers').update(payload).eq('id', id).select().single();
    if (error || !data) throw error;
    return data as Supplier;
  } catch {
    const list = LocalStorageRepository.getSuppliers();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    list[idx] = { ...list[idx], ...payload };
    LocalStorageRepository.set('suppliers', list);
    return list[idx];
  }
}

/**
 * Deletes a supplier by ID.
 * @param id Supplier ID
 */
export async function deleteSupplier(id: string): Promise<void> {
  try {
    await supabase.from('suppliers').delete().eq('id', id);
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.deleteItem<Supplier>('suppliers', id);
}

/**
 * Clears all suppliers from the directory.
 */
export async function clearAllSuppliers(): Promise<void> {
  try {
    await supabase.from('suppliers').delete().neq('id', '___non_existent___');
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.clearTable('suppliers');
}
