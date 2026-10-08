// Supabase Edge Function: extract-invoice
// Securely proxies invoice parsing to OpenRouter without exposing API keys to the browser.
// Uses Deno standard HTTP server with CORS, strict XML prompt fencing, and JSON validation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractionRequest {
  imageBase64?: string;
  mimeType?: string;
  textPayload?: string;
  fileName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ExtractionRequest = await req.json();
    const { imageBase64, mimeType, textPayload, fileName } = body;

    if (!imageBase64 && !textPayload) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 or textPayload in request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a specialized Tax Invoice Data Extractor for Indian GST and international commercial invoices.
Your goal is to parse document contents into a strict JSON structure.
IMPORTANT RULES:
1. NEVER invent, hallucinate, or assume missing information. If a field is missing, ambiguous, or not readable, set it to null.
2. Flag any uncertain data with a warning flag in the "discrepancies" array.
3. Validate mathematical calculations: (taxable_value = quantity * unit_rate - discount_amount) and (total = taxable_value + cgst_amount + sgst_amount + igst_amount).
4. Return ONLY a single raw JSON object matching the requested schema, without markdown formatting or surrounding backticks.`;

    const userInstructions = `Extract all details from the provided invoice file "${fileName || "invoice"}".
Return valid JSON matching this exact TypeScript structure:
{
  "invoice_number": string | null,
  "invoice_date": string | null (YYYY-MM-DD format),
  "due_date": string | null (YYYY-MM-DD format),
  "supplier": {
    "name": string | null,
    "gstin": string | null,
    "address": string | null,
    "state_code": string | null
  },
  "buyer": {
    "name": string | null,
    "gstin": string | null,
    "address": string | null,
    "state_code": string | null
  },
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
      "confidence_score": number (0.0 to 1.0),
      "flags": string[]
    }
  ],
  "totals": {
    "total_taxable": number,
    "total_cgst": number,
    "total_sgst": number,
    "total_igst": number,
    "grand_total": number
  },
  "discrepancies": string[]
}

<untrusted_document_content>
${textPayload || "Base64 Image Attached"}
</untrusted_document_content>`;

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userInstructions },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType || "image/png"};base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: userInstructions
      });
    }

    const openRouterModel = Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://invoice-to-stock.internal",
        "X-Title": "InvoiceToStock",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: messages,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter API returned error ${response.status}: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "{}";
    const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
    const parsedData = JSON.parse(cleaned);

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal extraction error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
