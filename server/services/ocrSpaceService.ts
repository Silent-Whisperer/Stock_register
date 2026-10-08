import fs from 'fs';
import { serverConfig } from '../config';

export interface OcrSpaceResult {
  success: boolean;
  text: string;
  lines: string[];
  errorMessage?: string;
}

/**
 * Performs OCR text extraction using OCR.space free tier REST API.
 * Supports PDF, PNG, JPG, JPEG, and WEBP formats.
 *
 * @param filePath - Local disk path to the temporary invoice file.
 * @param mimeType - MIME type of the uploaded document.
 * @param fileName - Original filename of the invoice.
 * @returns {Promise<OcrSpaceResult>} Extracted raw text and line items.
 */
export async function extractTextWithOcrSpace(
  filePath: string,
  mimeType: string,
  fileName: string = 'invoice.jpg'
): Promise<OcrSpaceResult> {
  const apiKey = serverConfig.ocrSpaceApiKey;
  if (!apiKey) {
    return { success: false, text: '', lines: [], errorMessage: 'OCR.space API key is not configured.' };
  }

  const fileBytes = fs.readFileSync(filePath);
  const blob = new Blob([fileBytes], { type: mimeType });

  // Try Engine 2 first (optimized for tabular receipts/invoices), fallback to Engine 1 if empty
  const engines = ['2', '1'];
  let lastError = '';

  for (const engine of engines) {
    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('apikey', apiKey);
      formData.append('language', 'eng');
      formData.append('isTable', 'true');
      formData.append('OCREngine', engine);
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        continue;
      }

      const json = await response.json();
      if (json.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(json.ErrorMessage)
          ? json.ErrorMessage.join(', ')
          : json.ErrorMessage || 'OCR.space processing error';
        lastError = errorMsg;
        continue;
      }

      const parsedResults = json.ParsedResults;
      if (Array.isArray(parsedResults) && parsedResults.length > 0) {
        const fullText = parsedResults
          .map((r: any) => r.ParsedText || '')
          .filter(Boolean)
          .join('\n')
          .trim();

        if (fullText) {
          const lines = fullText
            .split('\n')
            .map((line: string) => line.trim())
            .filter(Boolean);

          return {
            success: true,
            text: fullText,
            lines,
          };
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error communicating with OCR.space';
    }
  }

  return {
    success: false,
    text: '',
    lines: [],
    errorMessage: lastError || 'No readable text could be recognized by OCR.space',
  };
}
