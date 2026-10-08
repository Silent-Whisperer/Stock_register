import React from 'react';
import type { StockRegisterFilters } from '../../types';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface StockFiltersBarProps {
  filters: StockRegisterFilters;
  onFilterChange: (filters: StockRegisterFilters) => void;
}

export const StockFiltersBar: React.FC<StockFiltersBarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex flex-1 items-center gap-3 w-full">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search SKU, Product Name, HSN..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Low Stock Filter */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium px-2 py-1.5 rounded hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={filters.lowStockOnly}
            onChange={(e) => onFilterChange({ ...filters, lowStockOnly: e.target.checked })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <Filter className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Alerts Only</span>
        </label>
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-medium">Sort:</span>
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
            onFilterChange({ ...filters, sortBy, sortOrder });
          }}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="name-asc">Product Name (A-Z)</option>
          <option value="name-desc">Product Name (Z-A)</option>
          <option value="current_stock-asc">Current Stock (Lowest)</option>
          <option value="current_stock-desc">Current Stock (Highest)</option>
          <option value="sku-asc">SKU Code</option>
          <option value="updated_at-desc">Recently Updated</option>
        </select>
      </div>
    </div>
  );
};
