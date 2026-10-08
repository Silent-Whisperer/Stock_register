import React, { useEffect, useState } from 'react';
import {
  getInvoiceById,
  updateInvoiceAndItems,
  approveInvoiceAndMutateStock,
} from '../services/invoiceService';
import type { Invoice, InvoiceItem } from '../types';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { DocumentViewer } from '../components/review/DocumentViewer';
import { InvoiceHeaderForm } from '../components/review/InvoiceHeaderForm';
import { LineItemsTable } from '../components/review/LineItemsTable';
import { TaxSummaryCard } from '../components/review/TaxSummaryCard';
import { ReviewHeaderBanner } from '../components/review/ReviewHeaderBanner';
import { ReviewActionBar } from '../components/review/ReviewActionBar';
import { Button } from '../components/common/Button';
import { ArrowLeft } from 'lucide-react';

interface InvoiceReviewPageProps {
  invoiceId: string;
  onBack: () => void;
  onApproved: () => void;
}

/**
 * Flagship Invoice Review screen.
 * Implements workflow: Original Invoice -> Extracted Data -> Review -> Approve.
 */
export const InvoiceReviewPage: React.FC<InvoiceReviewPageProps> = ({
  invoiceId,
  onBack,
  onApproved,
}) => {
  const { user } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getInvoiceById(invoiceId)
      .then((inv) => {
        if (mounted) {
          const processedItems = (inv.items || []).map((it) => {
            const qty = Number(it.quantity) || 1;
            const rate = Number(it.unit_rate) || 0;
            const taxable = Number(it.taxable_value) || 0;
            if (rate === 0 && taxable > 0) {
              return { ...it, quantity: qty, unit_rate: Math.round((taxable / qty) * 100) / 100 };
            }
            return it;
          });
          setInvoice(inv);
          setItems(processedItems);
        }
      })
      .catch((err) => {
        if (mounted) notifyError('Error Loading Invoice', err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  const isReadOnly = invoice?.status === 'APPROVED' || invoice?.status === 'REJECTED';

  const handleHeaderChange = (field: keyof Invoice, value: any) => {
    if (!invoice || isReadOnly) return;
    setInvoice({ ...invoice, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    if (isReadOnly) return;
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    if (
      [
        'quantity',
        'unit_rate',
        'discount_amount',
        'cgst_rate',
        'sgst_rate',
        'igst_rate',
      ].includes(field as string)
    ) {
      const qty = Number(current.quantity) || 0;
      const rate = Number(current.unit_rate) || 0;
      const disc = Number(current.discount_amount) || 0;
      const taxable = Math.max(0, qty * rate - disc);
      current.taxable_value = Math.round(taxable * 100) / 100;

      const cgstAmt = (taxable * (Number(current.cgst_rate) || 0)) / 100;
      const sgstAmt = (taxable * (Number(current.sgst_rate) || 0)) / 100;
      const igstAmt = (taxable * (Number(current.igst_rate) || 0)) / 100;

      current.cgst_amount = Math.round(cgstAmt * 100) / 100;
      current.sgst_amount = Math.round(sgstAmt * 100) / 100;
      current.igst_amount = Math.round(igstAmt * 100) / 100;
      current.total_amount = Math.round((taxable + cgstAmt + sgstAmt + igstAmt) * 100) / 100;
    }

    newItems[index] = current;
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (isReadOnly) return;
    const newItem: InvoiceItem = {
      id: `item-new-${Date.now()}`,
      invoice_id: invoiceId,
      product_id: null,
      item_description: 'New Product Item',
      hsn_sac: null,
      quantity: 1,
      unit: 'PCS',
      unit_rate: 0,
      discount_amount: 0,
      taxable_value: 0,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 0,
      igst_amount: 0,
      total_amount: 0,
      confidence_score: 1.0,
      flags: [],
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (isReadOnly) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!invoice) return;
    setSaving(true);
    try {
      await updateInvoiceAndItems(invoice.id, invoice, items);
      notifySuccess('Draft Saved', 'Invoice changes saved successfully.');
    } catch (err: any) {
      notifyError('Save Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;
    setSaving(true);
    try {
      await updateInvoiceAndItems(invoice.id, invoice, items);
      await approveInvoiceAndMutateStock(invoice.id, user?.id || 'admin-user');
      notifySuccess('Invoice Approved', 'Invoice approved and verified successfully.');
      onApproved();
    } catch (err: any) {
      notifyError('Approval Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!invoice) return;
    setSaving(true);
    try {
      await updateInvoiceAndItems(invoice.id, { status: 'REJECTED' }, items);
      notifySuccess('Invoice Rejected', 'Invoice marked as rejected.');
      onBack();
    } catch (err: any) {
      notifyError('Reject Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-slate-500 space-y-3">
        <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p>Loading invoice review details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white border border-slate-200 rounded-lg space-y-4">
        <h3 className="text-base font-bold text-slate-900">Invoice Not Found</h3>
        <p className="text-xs text-slate-500">The requested invoice ID may have been deleted.</p>
        <Button variant="primary" size="sm" onClick={onBack} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Workflow Header Banner */}
      <ReviewHeaderBanner
        invoiceNumber={invoice.invoice_number}
        status={invoice.status}
        onBack={onBack}
      />

      {/* Substantial Two-Column Review Area: Document on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <DocumentViewer
          fileName={invoice.file_name}
          fileUrl={invoice.file_url}
          fileSize={invoice.file_size}
          fileType={invoice.file_type}
        />
        <InvoiceHeaderForm
          invoice={invoice}
          isReadOnly={isReadOnly}
          onChange={handleHeaderChange}
        />
      </div>

      {/* Full-Width Line Items Table Below Document & Details */}
      <LineItemsTable
        items={items}
        isReadOnly={isReadOnly}
        onItemChange={handleItemChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
      />

      {/* Compact Financial Tax Summary */}
      <TaxSummaryCard items={items} />

      {/* Bottom Sticky Action Bar */}
      <ReviewActionBar
        itemCount={items.length}
        isReadOnly={isReadOnly}
        saving={saving}
        onApprove={handleApprove}
        onSaveDraft={handleSaveDraft}
        onReject={handleReject}
      />
    </div>
  );
};
