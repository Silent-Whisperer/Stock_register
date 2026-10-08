import React from 'react';
import type { InvoiceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';

interface LineItemsTableProps {
  items: InvoiceItem[];
  isReadOnly: boolean;
  onItemChange: (index: number, field: keyof InvoiceItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

/**
 * Full-width, spreadsheet-style line items table.
 * Allows inline editing with restrained, borderless cell styling.
 */
export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  isReadOnly,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Line Items & Calculations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any cell to edit descriptions, quantities, unit rates, and taxes.
          </p>
        </div>
        {!isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Add Line Item
          </Button>
        )}
      </div>

      {/* Spreadsheet-like Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3 py-3 w-10 text-center">#</th>
              <th className="px-3 py-3 min-w-[320px]">Item Description</th>
              <th className="px-3 py-3 w-28 text-center">HSN/SAC</th>
              <th className="px-3 py-3 w-20 text-right">Qty</th>
              <th className="px-3 py-3 w-16 text-center">Unit</th>
              <th className="px-3 py-3 w-28 text-right">Rate (₹)</th>
              <th className="px-3 py-3 w-24 text-right">Disc (₹)</th>
              <th className="px-3 py-3 w-32 text-right">Taxable (₹)</th>
              <th className="px-3 py-3 w-20 text-right">CGST %</th>
              <th className="px-3 py-3 w-20 text-right">SGST %</th>
              <th className="px-3 py-3 w-20 text-right">IGST %</th>
              <th className="px-3 py-3 w-32 text-right">Total (₹)</th>
              {!isReadOnly && <th className="px-2 py-3 w-10 text-center" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                  No line items found. Click "Add Line Item" to enter items manually.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                return (
                  <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                    {/* Index */}
                    <td className="px-3 py-2 text-center font-mono text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.item_description}
                        onChange={(e) => onItemChange(index, 'item_description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-sm text-slate-900 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* HSN/SAC */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.hsn_sac || ''}
                        onChange={(e) => onItemChange(index, 'hsn_sac', e.target.value)}
                        className="w-full text-center px-1.5 py-1.5 font-mono text-sm border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-900 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="any"
                        disabled={isReadOnly}
                        value={item.quantity}
                        onChange={(e) =>
                          onItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1.5 py-1.5 font-mono text-sm border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-900 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.unit || 'PCS'}
                        onChange={(e) => onItemChange(index, 'unit', e.target.value.toUpperCase())}
                        className="w-full uppercase text-center px-1 py-1.5 font-mono text-xs border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-700 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Unit Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={item.unit_rate}
                        onChange={(e) =>
                          onItemChange(index, 'unit_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1.5 py-1.5 font-mono text-sm border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-900 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={item.discount_amount}
                        onChange={(e) =>
                          onItemChange(index, 'discount_amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1.5 py-1.5 font-mono text-sm border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-600 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Taxable Value */}
                    <td className="px-3 py-2 text-right font-mono font-medium text-slate-900 text-sm">
                      ₹{Number(item.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* CGST Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.cgst_rate}
                        onChange={(e) =>
                          onItemChange(index, 'cgst_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1 py-1.5 font-mono text-xs border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-800 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* SGST Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.sgst_rate}
                        onChange={(e) =>
                          onItemChange(index, 'sgst_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1 py-1.5 font-mono text-xs border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-800 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* IGST Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.igst_rate}
                        onChange={(e) =>
                          onItemChange(index, 'igst_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-1 py-1.5 font-mono text-xs border border-transparent hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 rounded text-slate-800 transition-colors disabled:bg-transparent"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Delete Action */}
                    {!isReadOnly && (
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove line item"
                          aria-label={`Remove line item ${index + 1}`}
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
