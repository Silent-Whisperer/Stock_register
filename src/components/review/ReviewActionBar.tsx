import React from 'react';
import { Check, Save, XCircle } from 'lucide-react';

interface ReviewActionBarProps {
  itemCount: number;
  isReadOnly: boolean;
  saving: boolean;
  onApprove: () => void;
  onSaveDraft: () => void;
  onReject: () => void;
}

/**
 * Sticky bottom action bar with dominant approval action, save draft, and reject.
 */
export const ReviewActionBar: React.FC<ReviewActionBarProps> = ({
  itemCount,
  isReadOnly,
  saving,
  onApprove,
  onSaveDraft,
  onReject,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 px-8 py-3.5 z-20 flex items-center justify-between shadow-xs">
      <div className="text-xs text-slate-500 font-medium hidden sm:block">
        {itemCount} Line Item{itemCount !== 1 ? 's' : ''}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {!isReadOnly && (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={onReject}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onSaveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
          </>
        )}

        <button
          type="button"
          disabled={saving || isReadOnly}
          onClick={onApprove}
          className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-md transition-all shadow-sm ${
            isReadOnly
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-black text-white hover:shadow'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{isReadOnly ? 'Invoice Completed' : 'Approve Invoice'}</span>
        </button>
      </div>
    </div>
  );
};
