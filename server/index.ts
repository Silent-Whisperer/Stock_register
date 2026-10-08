import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { serverConfig } from './config';
import extractRouter from './routes/extract';
import healthRouter from './routes/health';
import invoicesRouter from './routes/invoices';
import authRouter from './routes/auth';

export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible local preview/proxy
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// API Routes
app.use('/api', healthRouter);
app.use('/api', extractRouter);
app.use('/api', invoicesRouter);
app.use('/api', authRouter);

// Serve static frontend assets built by Vite
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback for all non-API web routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    next();
    return;
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('SRIC REGISTER API Server running. Client build not found in dist.');
    }
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
  });
});

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = serverConfig.port;
  app.listen(PORT, () => {
    console.log(`Backend API Server running at http://localhost:${PORT}`);
  });
}
