import { Router, Request, Response } from 'express';
import { serverConfig } from '../config';

const router = Router();

/**
 * GET /api/health
 * Returns server health and operational status.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'invoice-to-stock-api',
    model: serverConfig.openRouterModel,
    openRouterConfigured: Boolean(serverConfig.openRouterApiKey),
    supabaseConfigured: Boolean(serverConfig.supabaseUrl),
  });
});

export default router;
