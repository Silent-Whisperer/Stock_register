import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = `notif-${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const success = useCallback((title: string, message?: string) => notify('success', title, message), [notify]);
  const error = useCallback((title: string, message?: string) => notify('error', title, message), [notify]);
  const warning = useCallback((title: string, message?: string) => notify('warning', title, message), [notify]);
  const info = useCallback((title: string, message?: string) => notify('info', title, message), [notify]);

  return (
    <NotificationContext.Provider value={{ notify, success, error, warning, info }}>
      {children}
      {/* Toast container with accessible polite region */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-md border shadow-md text-sm transition-all duration-200 ${
              n.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : n.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : n.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {n.type === 'info' && <Info className="w-5 h-5 text-slate-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs tracking-wide uppercase opacity-90">{n.title}</p>
              {n.message && <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">{n.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => remove(n.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-800 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
}
