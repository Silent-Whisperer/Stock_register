import React from 'react';
import type { InvoiceFilters, InvoiceStatus } from '../../types';
import { Search } from 'lucide-react';

interface InvoiceFiltersBarProps {
  filters: InvoiceFilters;
  onFilterChange: (filters: InvoiceFilters) => void;
}

export const InvoiceFiltersBar: React.FC<InvoiceFiltersBarProps> = ({
  filters,
  onFilterChange,
}) => {
  const statuses: Array<{ value: 'ALL' | InvoiceStatus; label: string }> = [
    { value: 'ALL', label: 'All Invoices' },
    { value: 'PENDING_APPROVAL', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'DRAFT', label: 'Draft' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Search by invoice number or supplier..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
        />
      </div>

      {/* Status Segmented Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-0.5 bg-slate-100 rounded-md border border-slate-200 text-xs">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onFilterChange({ ...filters, status: s.value })}
            className={`px-3 py-1 font-medium rounded transition-colors whitespace-nowrap ${
              filters.status === s.value
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};
