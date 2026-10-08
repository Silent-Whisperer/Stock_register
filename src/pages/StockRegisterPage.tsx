import React, { useEffect, useState, useCallback } from 'react';
import { getStockRegister, updateProductStockDetails, deleteStockItem, clearAllStock } from '../services/stockService';
import type { Product, StockRegisterFilters } from '../types';
import { useNotification } from '../context/NotificationContext';
import { StockFiltersBar } from '../components/stock/StockFiltersBar';
import { StockRegisterTable } from '../components/stock/StockRegisterTable';
import { Button } from '../components/common/Button';
import { Trash2 } from 'lucide-react';

export const StockRegisterPage: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<StockRegisterFilters>({
    searchQuery: '',
    lowStockOnly: false,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });

  const loadStockData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStockRegister(currentPage, 50, filters);
      setProducts(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      notifyError('Failed to fetch stock records', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, notifyError]);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  const handleFilterChange = (newFilters: StockRegisterFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleSaveRow = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await updateProductStockDetails(id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      notifySuccess('Stock Item Updated', `Successfully updated ${updated.name}`);
    } catch (err: any) {
      notifyError('Update Failed', err.message);
      throw err;
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await deleteStockItem(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      notifySuccess('Stock Item Removed', 'Product removed from stock register.');
    } catch (err: any) {
      notifyError('Delete Failed', err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear the entire stock register? All inventory and transaction ledgers will be permanently removed.')) {
      return;
    }
    try {
      await clearAllStock();
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
      notifySuccess('Stock Register Cleared', 'All inventory records have been cleared.');
    } catch (err: any) {
      notifyError('Clear Failed', err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Stock Register</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perpetual inventory ledger updated upon verified invoice approvals. (50 rows/page)
          </p>
        </div>
        {products.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-300 self-start sm:self-auto"
          >
            Clear Full Register
          </Button>
        )}
      </div>

      <StockFiltersBar filters={filters} onFilterChange={handleFilterChange} />

      <StockRegisterTable
        products={products}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={50}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setCurrentPage}
        onSaveRow={handleSaveRow}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  );
};
