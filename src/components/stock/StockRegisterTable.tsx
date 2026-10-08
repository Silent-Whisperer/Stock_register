import React, { useState } from 'react';
import type { Product } from '../../types';
import { StockRegisterRow } from './StockRegisterRow';
import { Pagination } from '../common/Pagination';
import { TransactionLedgerModal } from './TransactionLedgerModal';

interface StockRegisterTableProps {
  products: Product[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSaveRow: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteRow?: (id: string) => void;
}

export const StockRegisterTable: React.FC<StockRegisterTableProps> = ({
  products,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  loading,
  onPageChange,
  onSaveRow,
  onDeleteRow,
}) => {
  const [selectedProductForLedger, setSelectedProductForLedger] = useState<Product | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3 py-2.5 w-28">SKU Code</th>
              <th className="px-3 py-2.5 min-w-[240px]">Product Name & Specification</th>
              <th className="px-3 py-2.5 w-24">HSN/SAC</th>
              <th className="px-3 py-2.5 w-28 text-right">In Stock</th>
              <th className="px-3 py-2.5 w-16 text-center">Unit</th>
              <th className="px-3 py-2.5 w-28 text-right">Purchase (₹)</th>
              <th className="px-3 py-2.5 w-28 text-right">Selling (₹)</th>
              <th className="px-3 py-2.5 w-20 text-right">Reorder</th>
              <th className="px-3 py-2.5 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  Loading stock register records...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No stock items match your search or filter criteria.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <StockRegisterRow
                  key={product.id}
                  product={product}
                  onSaveRow={onSaveRow}
                  onViewLedger={(prod) => setSelectedProductForLedger(prod)}
                  onDeleteRow={onDeleteRow}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      <TransactionLedgerModal
        product={selectedProductForLedger}
        isOpen={Boolean(selectedProductForLedger)}
        onClose={() => setSelectedProductForLedger(null)}
      />
    </div>
  );
};
