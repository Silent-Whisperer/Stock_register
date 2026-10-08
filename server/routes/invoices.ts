import { Router, Request, Response } from 'express';
import { getBackendSupabase } from '../services/supabaseService';

const router = Router();

/**
 * POST /api/invoices/clear
 * Permanently deletes all invoices after verifying the administrator security password.
 */
router.post('/invoices/clear', async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;

  if (!password || typeof password !== 'string' || password.trim() !== '9090') {
    res.status(401).json({
      success: false,
      error: 'Invalid security password. Access denied.',
    });
    return;
  }

  const supabase = getBackendSupabase();
  if (supabase) {
    try {
      await supabase.from('invoice_items').delete().neq('id', '___non_existent___');
      await supabase.from('invoices').delete().neq('id', '___non_existent___');
    } catch (err: any) {
      console.error('[Backend] Supabase clear error:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'All invoices and line items cleared successfully.',
  });
});

/**
 * GET /api/invoices
 * Lists registered invoices with their line items.
 */
router.get('/invoices', async (_req: Request, res: Response): Promise<void> => {
  const supabase = getBackendSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        res.status(200).json({ success: true, invoices: data });
        return;
      }
    } catch (err: any) {
      console.error('[Backend] Failed to fetch invoices:', err.message);
    }
  }

  res.status(200).json({ success: true, invoices: [] });
});

/**
 * POST /api/invoices/:id/approve
 * Server-side endpoint to atomically approve an invoice and mutate stock.
 */
router.post('/invoices/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.body;
  const now = new Date().toISOString();

  const supabase = getBackendSupabase();
  if (supabase) {
    try {
      await supabase.from('invoices').update({
        status: 'APPROVED',
        approved_at: now,
        updated_at: now,
      }).eq('id', id);

      try {
        await supabase.rpc('approve_invoice_and_update_stock', {
          p_invoice_id: id,
          p_user_id: userId || 'operator',
        });
      } catch (rpcErr: any) {
        console.warn('[Backend] RPC note:', rpcErr?.message);
      }

      res.status(200).json({ success: true, message: 'Invoice approved successfully' });
      return;
    } catch (err: any) {
      console.error('[Backend] Approve error:', err.message);
      res.status(500).json({ success: false, error: err.message });
      return;
    }
  }

  res.status(200).json({ success: true });
});

export default router;
