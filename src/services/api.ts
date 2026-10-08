import type { ExtractionResponse } from '../types';

/**
 * Uploads an invoice file to the server-side extraction endpoint.
 * Validates binary magic signatures on server, processes with OpenRouter, and returns structured data.
 *
 * @param file The user selected PDF, PNG, or JPEG file
 * @returns Promise<ExtractionResponse>
 */
export async function uploadAndExtractInvoice(file: File): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/extract-invoice', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Extraction service unavailable' }));
    throw new Error(errorData.error || `Server responded with HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Checks server health and OpenRouter model status.
 */
export async function fetchServerHealth(): Promise<{
  status: string;
  model: string;
  openRouterConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  } catch {
    return {
      status: 'offline',
      model: 'local-fallback',
      openRouterConfigured: false,
    };
  }
}
