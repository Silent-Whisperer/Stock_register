import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

export type ProcessingStep = 'idle' | 'uploading' | 'extracting' | 'preparing';

interface ProcessingStatusProps {
  fileName?: string;
  step: ProcessingStep;
}

/**
 * Sequential status indicator during invoice processing.
 * Displays clean 3-step progress without exposing technical engine details.
 */
export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ fileName, step }) => {
  return (
    <div className="py-8 px-4 max-w-md mx-auto text-center space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Processing Invoice</h2>
        {fileName && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {fileName}
          </p>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left space-y-3">
        {/* Step 1: Uploading */}
        <div className="flex items-center gap-3 text-xs">
          {step === 'uploading' ? (
            <Loader2 className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className={step === 'uploading' ? 'font-medium text-slate-900' : 'text-slate-600'}>
            Uploading
          </span>
        </div>

        {/* Step 2: Extracting invoice data */}
        <div className="flex items-center gap-3 text-xs">
          {step === 'extracting' ? (
            <Loader2 className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
          ) : step === 'preparing' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
          )}
          <span
            className={
              step === 'extracting'
                ? 'font-medium text-slate-900'
                : step === 'preparing'
                ? 'text-slate-600'
                : 'text-slate-400'
            }
          >
            Extracting invoice data
          </span>
        </div>

        {/* Step 3: Preparing for review */}
        <div className="flex items-center gap-3 text-xs">
          {step === 'preparing' ? (
            <Loader2 className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
          )}
          <span className={step === 'preparing' ? 'font-medium text-slate-900' : 'text-slate-400'}>
            Preparing for review
          </span>
        </div>
      </div>
    </div>
  );
};
