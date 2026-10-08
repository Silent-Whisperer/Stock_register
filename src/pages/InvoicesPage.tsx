import React, { useEffect, useState } from 'react';
import { getInvoices, clearAllInvoices } from '../services/invoiceService';
import type { Invoice, InvoiceFilters } from '../types';
import { InvoiceFiltersBar } from '../components/invoices/InvoiceFiltersBar';
import { InvoiceListTable } from '../components/invoices/InvoiceListTable';
import { ClearInvoicesModal } from '../components/invoices/ClearInvoicesModal';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { UploadCloud, Trash2 } from 'lucide-react';

interface InvoicesPageProps {
  onSelectInvoice: (id: string) => void;
  onNavigateToUpload: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  onSelectInvoice,
  onNavigateToUpload,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'ALL',
    searchQuery: '',
  });

  const loadInvoices = async () => {
    try {
      const data = await getInvoices(filters);
      setInvoices(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filters]);

  const handleClearInvoices = async (password: string) => {
    try {
      await clearAllInvoices(password);
      notifySuccess('Invoices Cleared', 'All invoices have been permanently deleted.');
      await loadInvoices();
    } catch (err: any) {
      notifyError('Clear Failed', err.message || 'Incorrect security password.');
      throw err;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit extracted invoices, verify supplier data, and approve invoice records.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {invoices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 hover:border-rose-300 font-medium"
            >
              Clear Table
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToUpload}
            icon={<UploadCloud className="w-3.5 h-3.5" />}
          >
            Upload Invoice
          </Button>
        </div>
      </div>

      <InvoiceFiltersBar filters={filters} onFilterChange={setFilters} />

      <InvoiceListTable invoices={invoices} onSelectInvoice={onSelectInvoice} />

      <ClearInvoicesModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearInvoices}
      />
    </div>
  );
};
