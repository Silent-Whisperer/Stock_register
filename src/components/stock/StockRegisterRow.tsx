import React, { useState } from 'react';
import type { Product } from '../../types';
import { Edit2, Check, X, History, AlertTriangle, Trash2 } from 'lucide-react';

interface StockRegisterRowProps {
  product: Product;
  onSaveRow: (id: string, updates: Partial<Product>) => Promise<void>;
  onViewLedger: (product: Product) => void;
  onDeleteRow?: (id: string) => void;
}

export const StockRegisterRow: React.FC<StockRegisterRowProps> = ({
  product,
  onSaveRow,
  onViewLedger,
  onDeleteRow,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    hsn_sac: product.hsn_sac || '',
    unit: product.unit,
    purchase_rate: product.purchase_rate,
    selling_rate: product.selling_rate,
    min_stock_alert: product.min_stock_alert,
  });

  const isLowStock = product.current_stock <= product.min_stock_alert;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveRow(product.id, {
        name: formData.name,
        hsn_sac: formData.hsn_sac || null,
        unit: formData.unit,
        purchase_rate: Number(formData.purchase_rate),
        selling_rate: Number(formData.selling_rate),
        min_stock_alert: Number(formData.min_stock_alert),
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: product.name,
      hsn_sac: product.hsn_sac || '',
      unit: product.unit,
      purchase_rate: product.purchase_rate,
      selling_rate: product.selling_rate,
      min_stock_alert: product.min_stock_alert,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/50">
        <td className="px-3 py-2 font-mono text-[11px] font-semibold text-slate-700">{product.sku}</td>
        <td className="px-3 py-2">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="text"
            value={formData.hsn_sac}
            onChange={(e) => setFormData({ ...formData, hsn_sac: e.target.value })}
            className="w-20 px-2 py-1 text-xs font-mono border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
          {product.current_stock}
        </td>
        <td className="px-3 py-2">
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value.toUpperCase() })}
            className="w-16 px-1.5 py-1 text-xs uppercase text-center font-mono border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            step="0.01"
            value={formData.purchase_rate}
            onChange={(e) => setFormData({ ...formData, purchase_rate: parseFloat(e.target.value) || 0 })}
            className="w-24 px-1.5 py-1 text-xs text-right font-mono border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            step="0.01"
            value={formData.selling_rate}
            onChange={(e) => setFormData({ ...formData, selling_rate: parseFloat(e.target.value) || 0 })}
            className="w-24 px-1.5 py-1 text-xs text-right font-mono border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            step="1"
            value={formData.min_stock_alert}
            onChange={(e) => setFormData({ ...formData, min_stock_alert: parseFloat(e.target.value) || 0 })}
            className="w-16 px-1.5 py-1 text-xs text-right font-mono border border-blue-400 rounded bg-white"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
              title="Save Row"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 text-slate-500 hover:bg-slate-200 rounded"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${isLowStock ? 'bg-amber-50/30' : ''}`}>
      <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-slate-700">{product.sku}</td>
      <td className="px-3 py-2.5">
        <div className="font-medium text-slate-900">{product.name}</div>
        {product.description && (
          <div className="text-[11px] text-slate-400 truncate max-w-sm">{product.description}</div>
        )}
      </td>
      <td className="px-3 py-2.5 font-mono text-slate-600">{product.hsn_sac || '—'}</td>
      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
        <div className="flex items-center justify-end gap-1.5">
          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>{product.current_stock}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-center font-mono text-slate-600 uppercase text-[11px]">
        {product.unit}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
        ₹{Number(product.purchase_rate).toFixed(2)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
        ₹{Number(product.selling_rate).toFixed(2)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-slate-500">
        {product.min_stock_alert}
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
            title="Edit Stock Item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewLedger(product)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200"
            title="View Audit Ledger"
          >
            <History className="w-3 h-3" />
            <span>Ledger</span>
          </button>
          {onDeleteRow && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete product "${product.name}" and remove from stock register?`)) {
                  onDeleteRow(product.id);
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete from Stock Register"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
