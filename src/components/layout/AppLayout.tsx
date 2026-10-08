import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { NavigationPage } from './Sidebar';
import { SkipLink } from '../common/SkipLink';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  pendingCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  pendingCount,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <SkipLink />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          pendingCount={pendingCount}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-between focus:outline-none"
        >
          <div className="w-full max-w-[1600px] mx-auto flex-1">
            {children}
          </div>
          <footer className="w-full max-w-[1600px] mx-auto pt-6 pb-2 text-center text-xs text-slate-400">
            made by Joy
          </footer>
        </main>
      </div>
    </div>
  );
};
