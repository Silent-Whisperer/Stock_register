import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DiscrepancyAlertsProps {
  discrepancies: string[];
}

export const DiscrepancyAlerts: React.FC<DiscrepancyAlertsProps> = ({ discrepancies }) => {
  if (discrepancies.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 text-xs text-emerald-800">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <span className="font-semibold">Deterministic Math & GST Rules Passed:</span> All line items, tax components, and grand totals are mathematically consistent.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
      <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Verification Flags Detected ({discrepancies.length})</span>
      </div>
      <p className="text-slate-600 mb-2">
        AI extraction flagged the following items requiring human operator attention before approval:
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-800">
        {discrepancies.map((d, index) => (
          <li key={index} className="leading-snug">
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
};
