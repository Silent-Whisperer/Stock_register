import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { validateFileMagicBytes } from '../utils/magicBytes';
import { extractInvoiceWithOpenRouter } from '../services/openRouterService';
import { extractTextWithOcrSpace } from '../services/ocrSpaceService';

const router = Router();

// Store files strictly on temporary disk storage to prevent memory buffer exhaustion
const upload = multer({
  dest: path.join(os.tmpdir(), 'invoice-uploads'),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

/**
 * POST /api/ocr-space
 * Direct OCR text recognition endpoint powered by OCR.space free tier API.
 */
router.post(
  '/ocr-space',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No invoice file was provided in the request.' });
      return;
    }

    const tempFilePath = req.file.path;
    const originalName = req.file.originalname || 'invoice.pdf';

    try {
      const magicResult = validateFileMagicBytes(tempFilePath);
      if (!magicResult.valid) {
        res.status(400).json({
          error: magicResult.error || 'Invalid file format.',
        });
        return;
      }

      const ocrResult = await extractTextWithOcrSpace(tempFilePath, magicResult.mime || 'application/octet-stream', originalName);

      res.status(200).json({
        success: ocrResult.success,
        text: ocrResult.text,
        lines: ocrResult.lines,
        errorMessage: ocrResult.errorMessage,
      });
    } catch (error: any) {
      next(error);
    } finally {
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
          // Ignore deletion error
        }
      }
    }
  }
);

/**
 * POST /api/extract-invoice
 * Secure invoice extraction endpoint with binary magic byte validation and cleanup.
 */
router.post(
  '/extract-invoice',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No invoice file was provided in the request.' });
      return;
    }

    const tempFilePath = req.file.path;
    const originalName = req.file.originalname || 'invoice.pdf';

    try {
      // 1. Mandatory Binary Magic Number Inspection
      const magicResult = validateFileMagicBytes(tempFilePath);
      if (!magicResult.valid) {
        res.status(400).json({
          error: magicResult.error || 'Invalid file format. Only legitimate PDF, PNG, and JPEG files are allowed.',
        });
        return;
      }

      // 2. Perform Extraction via OpenRouter Service with adaptive timeout and XML prompt fencing
      const extractedData = await extractInvoiceWithOpenRouter({
        filePath: tempFilePath,
        mimeType: magicResult.mime || 'application/octet-stream',
        fileName: originalName,
      });

      res.status(200).json({
        success: true,
        file: {
          originalName,
          mimeType: magicResult.mime,
          size: req.file.size,
        },
        data: extractedData,
      });
    } catch (error: any) {
      next(error);
    } finally {
      // 3. Immediately wipe temporary disk file to prevent storage leakage
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
          // Ignore deletion error
        }
      }
    }
  }
);

export default router;
