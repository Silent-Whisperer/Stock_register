import React, { useEffect, useState } from 'react';
import type { Product, StockTransaction } from '../../types';
import { getProductStockTransactions } from '../../services/stockService';
import { Modal } from '../common/Modal';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionLedgerModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionLedgerModal: React.FC<TransactionLedgerModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product || !isOpen) return;

    let mounted = true;
    setLoading(true);

    getProductStockTransactions(product.id)
      .then((data) => {
        if (mounted) setTransactions(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [product, isOpen]);

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Ledger: ${product.name}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">SKU Code:</span>
            <p className="font-mono font-semibold text-slate-900">{product.sku}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500">Current Balance:</span>
            <p className="font-bold text-sm text-slate-900">
              {product.current_stock} {product.unit}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Quantity</th>
                <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                <th className="px-3 py-2 text-right">Balance After</th>
                <th className="px-3 py-2">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    No inward/outward transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      {tx.transaction_type === 'INWARD' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" />
                          INWARD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <ArrowUpRight className="w-3 h-3" />
                          OUTWARD
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      +{tx.quantity}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">
                      ₹{Number(tx.unit_price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                      {tx.balance_after}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                      {tx.notes || (tx.invoice ? `Invoice #${tx.invoice.invoice_number}` : 'Direct Stock Inward')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
