import { supabase } from '../lib/supabase';
import { LocalStorageRepository } from '../lib/dataStore';
import type { Product } from '../types';

/**
 * Retrieves all catalog products.
 * @returns Promise<Product[]>
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error || !data) throw error;
    return data as Product[];
  } catch {
    return LocalStorageRepository.getProducts();
  }
}

/**
 * Creates a new product in the catalog.
 * @param product Partial product object
 * @returns Promise<Product>
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error || !data) throw error;
    return data as Product;
  } catch {
    const prods = LocalStorageRepository.getProducts();
    prods.unshift(newProduct);
    LocalStorageRepository.set('products', prods);
    return newProduct;
  }
}

/**
 * Updates an existing catalog product.
 * @param id Product ID
 * @param updates Partial fields to update
 * @returns Promise<Product>
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
    if (error || !data) throw error;
    return data as Product;
  } catch {
    const prods = LocalStorageRepository.getProducts();
    const idx = prods.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    prods[idx] = { ...prods[idx], ...payload };
    LocalStorageRepository.set('products', prods);
    return prods[idx];
  }
}

/**
 * Deletes a product by ID.
 * @param id Product ID
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.deleteItem<Product>('products', id);
}

/**
 * Clears all products from the catalog.
 */
export async function clearAllProducts(): Promise<void> {
  try {
    await supabase.from('products').delete().neq('id', '___non_existent___');
  } catch {
    // Continue to local repository
  }
  LocalStorageRepository.clearTable('products');
}
