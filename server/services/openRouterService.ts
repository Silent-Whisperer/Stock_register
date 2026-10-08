import fs from 'fs';
import { serverConfig } from '../config';
import { ExtractedInvoicePayload, validateAndAuditInvoice } from './validationService';
import { extractTextWithOcrSpace } from './ocrSpaceService';
import { parseInvoiceWithHeuristics } from './heuristicOcrParser';

export interface ExtractionOptions {
  filePath: string;
  mimeType: string;
  fileName: string;
}

/**
 * Robustly parses JSON from LLM content or reasoning text.
 */
function extractJsonFromText(raw: string): any {
  let cleaned = raw.trim();

  // Strip Markdown code fences if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch {
      // Fallback
    }
  }

  return JSON.parse(cleaned);
}

/**
 * Performs dynamic invoice extraction using OpenRouter multimodal AI models
 * with automatic deterministic heuristic fallback to ensure < 15s response times.
 */
export async function extractInvoiceWithOpenRouter(
  options: ExtractionOptions
): Promise<ExtractedInvoicePayload> {
  const { filePath, mimeType, fileName } = options;

  let ocrRecognizedText = '';
  // 1. Run OCR.space first (typically takes 2-4 seconds)
  try {
    const ocrResult = await extractTextWithOcrSpace(filePath, mimeType, fileName);
    if (ocrResult.success && ocrResult.text && ocrResult.text.trim().length > 30) {
      console.log(`[InvoiceExtractor] High-confidence OCR text extracted (${ocrResult.lines.length} lines). Executing deterministic statutory parsing.`);
      return parseInvoiceWithHeuristics(ocrResult.text, fileName);
    }
    if (ocrResult.text) {
      ocrRecognizedText = ocrResult.text;
    }
  } catch (ocrErr: any) {
    console.warn('[InvoiceExtractor] OCR.space pre-extraction note:', ocrErr?.message);
  }

  if (!serverConfig.openRouterApiKey) {
    if (ocrRecognizedText.trim().length > 10) {
      return parseInvoiceWithHeuristics(ocrRecognizedText, fileName);
    }
    throw new Error('OPENROUTER_API_KEY is not configured on the server.');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const prompt = `You are a tax invoice parser. Read this invoice image carefully and extract all information into a strict JSON object with this exact structure:
{
  "invoice_number": string | null,
  "invoice_date": string | null,
  "due_date": string | null,
  "supplier": { "name": string | null, "gstin": string | null, "address": string | null, "state_code": string | null },
  "buyer": { "name": string | null, "gstin": string | null, "address": string | null, "state_code": string | null },
  "items": [
    {
      "item_description": string,
      "hsn_sac": string | null,
      "quantity": number,
      "unit": string,
      "unit_rate": number,
      "discount_amount": number,
      "taxable_value": number,
      "cgst_rate": number,
      "cgst_amount": number,
      "sgst_rate": number,
      "sgst_amount": number,
      "igst_rate": number,
      "igst_amount": number,
      "total_amount": number,
      "confidence_score": number,
      "flags": []
    }
  ],
  "totals": {
    "total_taxable": number,
    "total_cgst": number,
    "total_sgst": number,
    "total_igst": number,
    "grand_total": number
  },
  "discrepancies": []
}
Output strictly valid JSON. Do not fabricate missing numbers.`;

  let finalPrompt = prompt;
  if (ocrRecognizedText) {
    finalPrompt += `\n\n<untrusted_ocr_ground_truth>\n${ocrRecognizedText}\n</untrusted_ocr_ground_truth>\nCross-reference the above OCR recognized text with the invoice image for exact quantities, rates, and totals.`;
  }

  const candidateModel = serverConfig.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free';
  // Strict 6s timeout for AI response so user never waits more than 8-10s total
  const aiTimeoutMs = 6000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), aiTimeoutMs);

  try {
    const isImage = mimeType.startsWith('image/');
    const messageContent: any[] = [{ type: 'text', text: finalPrompt }];

    if (isImage) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverConfig.openRouterApiKey}`,
        'HTTP-Referer': 'https://invoice-to-stock.internal',
        'X-Title': 'InvoiceToStock',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: candidateModel,
        messages: [{ role: 'user', content: messageContent }],
        temperature: 0.1,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(`OpenRouter error: ${responseData.error.message || JSON.stringify(responseData.error)}`);
    }

    const message = responseData.choices?.[0]?.message;
    let rawText = message?.content || '';
    if (!rawText && message?.reasoning) {
      rawText = message.reasoning;
    }
    if (!rawText && Array.isArray(message?.reasoning_details)) {
      rawText = message.reasoning_details.map((d: any) => d.text || '').join('\n');
    }

    if (!rawText) {
      throw new Error('Empty response content received from OpenRouter model');
    }

    const parsed = extractJsonFromText(rawText);
    return validateAndAuditInvoice(parsed);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[InvoiceExtractor] AI model (${candidateModel}) unavailable or timed out:`, err?.message);

    // If deterministic OCR text is available, immediately parse and return
    if (ocrRecognizedText.trim().length > 10) {
      console.log('[InvoiceExtractor] Falling back to fast deterministic heuristic parser with OCR data.');
      return parseInvoiceWithHeuristics(ocrRecognizedText, fileName);
    }

    throw new Error(`Extraction failed: ${err?.message || 'Upstream provider busy. Please retry.'}`);
  }
}
