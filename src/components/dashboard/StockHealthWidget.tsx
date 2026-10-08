import React from 'react';
import type { Product } from '../../types';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface StockHealthWidgetProps {
  products: Product[];
  onNavigateToStock: () => void;
}

export const StockHealthWidget: React.FC<StockHealthWidgetProps> = ({
  products,
  onNavigateToStock,
}) => {
  const lowStockItems = products.filter((p) => p.current_stock <= p.min_stock_alert);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Inventory Alerts</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {lowStockItems.length} Low Stock
          </span>
        </div>

        <div className="p-4 space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              All stock levels are above reorder thresholds.
            </div>
          ) : (
            lowStockItems.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-md flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {p.sku} | Threshold: {p.min_stock_alert} {p.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 text-sm">
                    {p.current_stock}
                  </span>{' '}
                  <span className="text-[11px] text-amber-800">{p.unit}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-right">
        <button
          type="button"
          onClick={onNavigateToStock}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <span>Open Full Stock Register</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
