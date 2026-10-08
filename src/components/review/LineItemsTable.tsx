import React from 'react';
import type { InvoiceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';

/**
 * Props for the LineItemsTable component.
 */
interface LineItemsTableProps {
  /** Array of line items belonging to the invoice. */
  items: InvoiceItem[];
  /** Whether the invoice is approved/rejected and read-only. */
  isReadOnly: boolean;
  /** Callback invoked when any editable field changes. */
  onItemChange: (index: number, field: keyof InvoiceItem, value: any) => void;
  /** Callback to append a new blank line item. */
  onAddItem: () => void;
  /** Callback to remove a line item by index. */
  onRemoveItem: (index: number) => void;
}

/**
 * Professional desktop line-item editor for tax invoice verification.
 * Features fixed minimum column widths, independent horizontal scrolling,
 * and a sticky product description column so line-item context is never lost.
 *
 * @param {LineItemsTableProps} props - Component properties.
 * @returns {React.ReactElement} Rendered table component.
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
      {/* Table Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Line Items & Calculations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and adjust descriptions, quantities, unit rates, and GST taxes.
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

      {/* Dedicated Horizontal Scroll Container (Page does not horizontally scroll) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1440px] text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs tracking-wider">
              {/* Frozen Index # */}
              <th className="sticky left-0 z-20 bg-slate-50 px-2.5 py-3 w-12 min-w-[48px] text-center border-r border-slate-200">
                #
              </th>
              {/* Frozen Item Description */}
              <th className="sticky left-12 z-20 bg-slate-50 px-3.5 py-3 w-[320px] min-w-[300px] text-left border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                DESCRIPTION
              </th>
              {/* Scrollable Financial Columns with Generous Min-Widths */}
              <th className="px-2.5 py-3 w-[105px] min-w-[100px] text-center">HSN/SAC</th>
              <th className="px-2.5 py-3 w-[85px] min-w-[80px] text-right">QTY</th>
              <th className="px-2 py-3 w-[80px] min-w-[75px] text-center">UNIT</th>
              <th className="px-2.5 py-3 w-[125px] min-w-[120px] text-right">RATE (₹)</th>
              <th className="px-2.5 py-3 w-[115px] min-w-[110px] text-right">DISC. (₹)</th>
              <th className="px-3 py-3 w-[135px] min-w-[130px] text-right">TAXABLE (₹)</th>
              <th className="px-2 py-3 w-[85px] min-w-[80px] text-center">CGST %</th>
              <th className="px-2 py-3 w-[85px] min-w-[80px] text-center">SGST %</th>
              <th className="px-2 py-3 w-[85px] min-w-[80px] text-center">IGST %</th>
              <th className="px-3 py-3 w-[145px] min-w-[140px] text-right">TOTAL (₹)</th>
              {!isReadOnly && (
                <th className="px-2 py-3 w-[50px] min-w-[50px] text-center" aria-label="Actions" />
              )}
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
              items.map((item, index) => (
                <tr key={item.id || index} className="group hover:bg-slate-50/70 transition-colors">
                  {/* Frozen Index # */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-2.5 py-2 w-12 min-w-[48px] text-center font-mono text-xs text-slate-500 border-r border-slate-200">
                    {index + 1}
                  </td>

                  {/* Frozen Item Description */}
                  <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-50 px-3.5 py-2 w-[320px] min-w-[300px] border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={item.item_description}
                      onChange={(e) => onItemChange(index, 'item_description', e.target.value)}
                      className="w-full h-9 px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-sm text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-700"
                    />
                  </td>

                  {/* HSN/SAC */}
                  <td className="px-2.5 py-2 w-[105px] min-w-[100px]">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={item.hsn_sac || ''}
                      placeholder="8471"
                      onChange={(e) => onItemChange(index, 'hsn_sac', e.target.value)}
                      className="w-full h-9 text-center font-mono text-sm border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-2.5 py-2 w-[85px] min-w-[80px]">
                    <input
                      type="number"
                      step="any"
                      disabled={isReadOnly}
                      value={item.quantity === 0 ? '' : (item.quantity ?? '')}
                      placeholder="1"
                      onChange={(e) =>
                        onItemChange(index, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-right font-mono font-medium text-sm px-2 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-2 py-2 w-[80px] min-w-[75px]">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={item.unit || 'PCS'}
                      onChange={(e) => onItemChange(index, 'unit', e.target.value.toUpperCase())}
                      className="w-full h-9 uppercase text-center font-mono font-medium text-xs px-1 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-800 transition-colors disabled:bg-slate-50 disabled:border-slate-200"
                    />
                  </td>

                  {/* Unit Rate */}
                  <td className="px-2.5 py-2 w-[125px] min-w-[120px]">
                    <input
                      type="number"
                      step="0.01"
                      disabled={isReadOnly}
                      value={item.unit_rate === 0 ? '' : (item.unit_rate ?? '')}
                      placeholder="0.00"
                      onChange={(e) =>
                        onItemChange(index, 'unit_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-right font-mono font-medium text-sm px-2 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-900 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* Discount */}
                  <td className="px-2.5 py-2 w-[115px] min-w-[110px]">
                    <input
                      type="number"
                      step="0.01"
                      disabled={isReadOnly}
                      value={item.discount_amount === 0 ? '' : (item.discount_amount ?? '')}
                      placeholder="0.00"
                      onChange={(e) =>
                        onItemChange(index, 'discount_amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-right font-mono text-sm px-2 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-700 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* Taxable Value */}
                  <td className="px-3 py-2 w-[135px] min-w-[130px] text-right font-mono font-semibold text-slate-900 text-sm whitespace-nowrap">
                    ₹{Number(item.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* CGST Rate */}
                  <td className="px-2 py-2 w-[85px] min-w-[80px]">
                    <input
                      type="number"
                      step="0.5"
                      disabled={isReadOnly}
                      value={item.cgst_rate === 0 ? '' : (item.cgst_rate ?? '')}
                      placeholder="0"
                      onChange={(e) =>
                        onItemChange(index, 'cgst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-center font-mono text-sm px-1 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-800 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* SGST Rate */}
                  <td className="px-2 py-2 w-[85px] min-w-[80px]">
                    <input
                      type="number"
                      step="0.5"
                      disabled={isReadOnly}
                      value={item.sgst_rate === 0 ? '' : (item.sgst_rate ?? '')}
                      placeholder="0"
                      onChange={(e) =>
                        onItemChange(index, 'sgst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-center font-mono text-sm px-1 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-800 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* IGST Rate */}
                  <td className="px-2 py-2 w-[85px] min-w-[80px]">
                    <input
                      type="number"
                      step="0.5"
                      disabled={isReadOnly}
                      value={item.igst_rate === 0 ? '' : (item.igst_rate ?? '')}
                      placeholder="0"
                      onChange={(e) =>
                        onItemChange(index, 'igst_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-9 text-center font-mono text-sm px-1 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded bg-white text-slate-800 transition-colors disabled:bg-slate-50 disabled:border-slate-200 placeholder:text-slate-400"
                    />
                  </td>

                  {/* Total Amount */}
                  <td className="px-3 py-2 w-[145px] min-w-[140px] text-right font-mono font-bold text-slate-950 text-sm whitespace-nowrap">
                    ₹{Number(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Delete Action */}
                  {!isReadOnly && (
                    <td className="px-2 py-2 w-[50px] min-w-[50px] text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove line item"
                        aria-label={`Remove line item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
