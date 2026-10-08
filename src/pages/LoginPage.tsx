import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const { error: notifyError } = useNotification();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      notifyError('Validation Error', 'Please enter your account password.');
      return;
    }

    if (password.trim() !== '9090') {
      notifyError('Authentication Failed', 'Invalid password. Security password is 9090.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login('operator@company.in', password.trim());
    } catch (err: any) {
      notifyError('Authentication Failed', err.message || 'Invalid password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-tighter">
            TS
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TAX INVOICE TO STOCK</span>
        </div>
        <p className="text-center text-xs text-slate-500 font-medium">
          Production Tax Invoice Verification & Stock Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                label="System Access Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="Enter password to access portal"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting || loading}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Stock Portal
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protected by Password Access & RLS Policies</span>
          </div>
        </div>
      </div>
    </div>
  );
};
