import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { Button } from '../common/Button';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Minimal application header with clean branding and user profile controls.
 */
export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white font-semibold text-xs tracking-wider">
          SR
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-none">
            SRIC REGISTER
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline font-medium text-slate-800">
            {user?.fullName || user?.email || 'Operator'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          aria-label="Sign out"
          className="text-slate-500 hover:text-slate-900 px-2 py-1 h-8 text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </header>
  );
};
