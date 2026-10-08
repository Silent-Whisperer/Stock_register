import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  UploadCloud,
} from 'lucide-react';

export type NavigationPage =
  | 'overview'
  | 'invoices'
  | 'stock'
  | 'products'
  | 'suppliers'
  | 'upload'
  | 'review';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  pendingCount?: number;
}

/**
 * Compact, professional sidebar navigation for invoice processing and verification.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  pendingCount = 0,
}) => {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'invoices' as const,
      label: 'Invoices',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'suppliers' as const, label: 'Suppliers', icon: Building2 },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between py-4 select-none">
      <div className="space-y-4 px-3">
        {/* Upload Action Button */}
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
            currentPage === 'upload'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-slate-600" />
          <span>Upload Invoice</span>
        </button>

        {/* Primary Navigation */}
        <nav aria-label="Main Navigation" className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'invoices' && currentPage === 'review');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        <p className="font-medium text-slate-600">Invoice Processing</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Statutory tax audit & verification</p>
      </div>
    </aside>
  );
};
