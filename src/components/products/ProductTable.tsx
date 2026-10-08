import React from 'react';
import type { Product } from '../../types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onDeleteProduct?: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, loading, onDeleteProduct }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">HSN / SAC</th>
              <th className="px-4 py-3 text-right">Purchase Price (₹)</th>
              <th className="px-4 py-3 text-right">Selling Price (₹)</th>
              <th className="px-4 py-3 text-right">Current Stock</th>
              <th className="px-4 py-3 text-center">Status</th>
              {onDeleteProduct && <th className="px-4 py-3 text-center w-16">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No products cataloged. Products are automatically cataloged upon invoice approval.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.current_stock <= p.min_stock_alert;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">{p.sku}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      {p.description && <div className="text-[11px] text-slate-400">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{p.hsn_sac || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      ₹{Number(p.purchase_rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      ₹{Number(p.selling_rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {p.current_stock} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    {onDeleteProduct && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete product "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Product"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
