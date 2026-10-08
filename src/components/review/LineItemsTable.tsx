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
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-xs">
              <th className="px-3 py-3.5 w-12 text-center">#</th>
              <th className="px-4 py-3.5 min-w-[340px]">Item Description</th>
              <th className="px-3 py-3.5 w-32 text-center">HSN/SAC</th>
              <th className="px-3 py-3.5 w-32 text-center">Qty</th>
              <th className="px-3 py-3.5 w-24 text-center">Unit</th>
              <th className="px-3 py-3.5 w-36 text-right">Rate (₹)</th>
              <th className="px-3 py-3.5 w-32 text-right">Disc (₹)</th>
              <th className="px-3 py-3.5 w-40 text-right">Taxable (₹)</th>
              <th className="px-3 py-3.5 w-24 text-center">CGST %</th>
              <th className="px-3 py-3.5 w-24 text-center">SGST %</th>
              <th className="px-3 py-3.5 w-24 text-center">IGST %</th>
              <th className="px-3 py-3.5 w-44 text-right">Total (₹)</th>
              {!isReadOnly && <th className="px-2 py-3.5 w-12 text-center" aria-label="Actions" />}
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
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-500 text-sm">
                      {index + 1}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.item_description}
                        onChange={(e) => onItemChange(index, 'item_description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-base font-medium text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200"
                      />
                    </td>

                    {/* HSN/SAC */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.hsn_sac || ''}
                        placeholder="8471"
                        onChange={(e) => onItemChange(index, 'hsn_sac', e.target.value)}
                        className="w-full text-center px-2 py-2 font-mono text-base font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="any"
                        disabled={isReadOnly}
                        value={item.quantity === 0 ? '' : item.quantity}
                        placeholder="1"
                        onChange={(e) =>
                          onItemChange(index, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center px-2 py-2 font-mono text-base font-extrabold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={item.unit || 'PCS'}
                        onChange={(e) => onItemChange(index, 'unit', e.target.value.toUpperCase())}
                        className="w-full uppercase text-center px-2 py-2 font-mono text-sm font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-800 transition-colors disabled:bg-slate-50 disabled:border-slate-200"
                      />
                    </td>

                    {/* Unit Rate */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={item.unit_rate === 0 ? '' : item.unit_rate}
                        placeholder="0.00"
                        onChange={(e) =>
                          onItemChange(index, 'unit_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-3 py-2 font-mono text-base font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={item.discount_amount === 0 ? '' : item.discount_amount}
                        placeholder="0.00"
                        onChange={(e) =>
                          onItemChange(index, 'discount_amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right px-2.5 py-2 font-mono text-base font-semibold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-700 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Taxable Value */}
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-slate-950 text-base">
                      ₹{Number(item.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* CGST Rate */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.cgst_rate === 0 ? '' : item.cgst_rate}
                        placeholder="0"
                        onChange={(e) =>
                          onItemChange(index, 'cgst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center px-1.5 py-2 font-mono text-base font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* SGST Rate */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.sgst_rate === 0 ? '' : item.sgst_rate}
                        placeholder="0"
                        onChange={(e) =>
                          onItemChange(index, 'sgst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center px-1.5 py-2 font-mono text-base font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* IGST Rate */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.5"
                        disabled={isReadOnly}
                        value={item.igst_rate === 0 ? '' : item.igst_rate}
                        placeholder="0"
                        onChange={(e) =>
                          onItemChange(index, 'igst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-center px-1.5 py-2 font-mono text-base font-bold border border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 rounded-md text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="px-3 py-3 text-right font-mono font-black text-slate-950 text-lg">
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
