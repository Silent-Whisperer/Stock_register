import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/invoiceService';
import type { Invoice } from '../types';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentInvoicesTable } from '../components/dashboard/RecentInvoicesTable';
import { InvoiceStatusSummaryWidget } from '../components/dashboard/InvoiceStatusSummaryWidget';
import { Button } from '../components/common/Button';
import { FileText, Clock, CheckCircle2, UploadCloud, IndianRupee } from 'lucide-react';
import type { NavigationPage } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (page: NavigationPage) => void;
  onSelectInvoice: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    let mounted = true;
    getInvoices()
      .then((invs) => {
        if (mounted) {
          setInvoices(invs);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = invoices.filter((i) => i.status === 'PENDING_APPROVAL').length;
  const approvedCount = invoices.filter((i) => i.status === 'APPROVED').length;
  const totalValue = invoices.reduce((acc, inv) => acc + (Number(inv.grand_total) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg px-6 py-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Invoice Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor invoice intake, tax verification, and approval statuses.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onNavigate('upload')}
          icon={<UploadCloud className="w-4 h-4" />}
          className="text-xs font-semibold px-4 py-2"
        >
          Upload Invoice
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Invoices"
          value={invoices.length}
          subtitle={`${invoices.length} Registered`}
          icon={FileText}
          badge={{ text: 'All Time', variant: 'neutral' }}
        />
        <MetricCard
          title="Pending Review"
          value={pendingCount}
          subtitle="Awaiting human review"
          icon={Clock}
          badge={{
            text: pendingCount > 0 ? `${pendingCount} Action Req.` : 'All Clear',
            variant: pendingCount > 0 ? 'warning' : 'positive',
          }}
        />
        <MetricCard
          title="Approved Invoices"
          value={approvedCount}
          subtitle="Verified and approved"
          icon={CheckCircle2}
          badge={{ text: 'Verified', variant: 'positive' }}
        />
        <MetricCard
          title="Total Value Processed"
          value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Cumulative invoice spend"
          icon={IndianRupee}
          badge={{ text: 'Grand Total', variant: 'neutral' }}
        />
      </div>

      {/* Tables and Processing Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentInvoicesTable
            invoices={invoices.slice(0, 6)}
            onSelectInvoice={onSelectInvoice}
          />
        </div>
        <div>
          <InvoiceStatusSummaryWidget
            invoices={invoices}
            onNavigateToInvoices={() => onNavigate('invoices')}
          />
        </div>
      </div>
    </div>
  );
};
