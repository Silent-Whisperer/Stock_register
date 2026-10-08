import type { Product, Supplier, Invoice, InvoiceItem, StockTransaction } from '../types';

const INITIAL_SUPPLIERS: Supplier[] = [];
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_INVOICES: Invoice[] = [];
const INITIAL_ITEMS: InvoiceItem[] = [];
const INITIAL_TRANSACTIONS: StockTransaction[] = [];

export class LocalStorageRepository {
  private static getKey(table: string): string {
    return `inv_stock_${table}`;
  }

  static get<T>(table: string, defaults: T[]): T[] {
    const raw = localStorage.getItem(this.getKey(table));
    if (!raw) {
      localStorage.setItem(this.getKey(table), JSON.stringify(defaults));
      return defaults;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return defaults;
    }
  }

  static set<T>(table: string, items: T[]): void {
    localStorage.setItem(this.getKey(table), JSON.stringify(items));
  }

  static clearAll(): void {
    ['suppliers', 'products', 'invoices', 'invoice_items', 'stock_transactions'].forEach((table) => {
      localStorage.removeItem(this.getKey(table));
    });
  }

  static clearTable(table: string): void {
    localStorage.removeItem(this.getKey(table));
  }

  static deleteItem<T extends { id: string }>(table: string, id: string): void {
    const items = this.get<T>(table, []);
    const filtered = items.filter((i) => i.id !== id);
    this.set(table, filtered);
  }

  static getSuppliers(): Supplier[] {
    return this.get<Supplier>('suppliers', INITIAL_SUPPLIERS);
  }

  static getProducts(): Product[] {
    return this.get<Product>('products', INITIAL_PRODUCTS);
  }

  static getInvoices(): Invoice[] {
    return this.get<Invoice>('invoices', INITIAL_INVOICES);
  }

  static getInvoiceItems(): InvoiceItem[] {
    return this.get<InvoiceItem>('invoice_items', INITIAL_ITEMS);
  }

  static getTransactions(): StockTransaction[] {
    return this.get<StockTransaction>('stock_transactions', INITIAL_TRANSACTIONS);
  }
}
