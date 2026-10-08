# Tax Invoice to Stock Register Management Portal

A production-quality invoice-to-stock management system built with **React, TypeScript, Tailwind CSS, Supabase Auth + PostgreSQL, and OpenRouter AI**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User["Operator (Browser)"] -->|Uploads PDF / JPG / PNG| WebApp["React + TS Web Application"]
    WebApp -->|Multi-part Form Upload| BackendAPI["Express Server / Supabase Edge Function"]
    
    subgraph Security & Verification Layer
        BackendAPI -->|1. Magic Bytes Check| MagicBytes["Binary Signature Validator (Blocks EXE/ELF)"]
        MagicBytes -->|2. XML Fenced Prompt| OpenRouter["OpenRouter AI Vision Model (Gemini / Claude / GPT)"]
        OpenRouter -->|Raw Extracted Data| RulesEngine["Deterministic GST & Math Rule Engine"]
    end

    RulesEngine -->|Returns Verified Data + Discrepancies| ReviewUI["Invoice Review & Edit Interface"]
    ReviewUI -->|Mandatory Operator Approval| ApproveAction["approve_invoice_and_update_stock()"]
    
    subgraph Database & Storage (Supabase)
        ApproveAction -->|Atomic Transaction| PostgreSQL[("Supabase PostgreSQL DB")]
        PostgreSQL -->|Upserts| Products["products Table"]
        PostgreSQL -->|Appends| StockTransactions["stock_transactions Ledger"]
        PostgreSQL -->|Updates Status| Invoices["invoices Table"]
    end
```

---

## ✨ Feature Checklist

- [x] **Secure Password Authentication**: Supabase Auth with RLS policies. Client never requires Supabase Dashboard access.
- [x] **Binary Signature Validation**: Server-side inspection of binary magic bytes (`%PDF`, `\x89PNG`, `\xFF\xD8\xFF`). Blocks disguised executables (`MZ`, `ELF`, Mach-O).
- [x] **AI-Powered Invoice Extraction**: Secure OpenRouter integration with XML prompt fencing (`<untrusted_document_content>`) and dynamic adaptive timeouts.
- [x] **Deterministic Math & GST Rules**: Validates Indian GSTIN format, state code alignment (Intra-state CGST/SGST vs Inter-state IGST), line item taxable amounts, and header total consistency.
- [x] **Mandatory Human Approval**: AI output NEVER mutates stock directly. Stock changes only after explicit operator review and approval.
- [x] **Perpetual Stock Register**: Spreadsheet-like table with server-side 50 rows/page pagination, search, filtering, sorting, inline cell editing, and save/cancel actions.
- [x] **Audit Ledger Trail**: Full inward stock movement ledger linked to invoice numbers and approver user IDs.
- [x] **Product Catalog & Supplier Directory**: Centralized SKU catalog and vendor directory with volume aggregation.
- [x] **Dual-Layer Test Suite**: Vitest suite covering binary security checks, GST math validation, and frontend component workflows.

---

## 🛡️ Security Overview

1. **Magic Bytes Inspection**: Upload routes inspect raw binary signatures instead of relying on file extensions or HTTP MIME headers.
2. **Prompt Injection Defense**: Untrusted invoice text is wrapped in strict XML tags (`<untrusted_document_content>`).
3. **Zero Secret Exposure**: OpenRouter API keys and Supabase service role keys are strictly handled server-side.
4. **Row-Level Security (RLS)**: PostgreSQL tables enforce access control via Supabase RLS policies.

---

## 🛠️ Local Setup Guide

### 1. Prerequisites
- Node.js v18+
- npm v9+

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your OpenRouter API key in `.env`:
```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=google/gemini-2.5-flash
AI_TIMEOUT_MS=45000
```

### 3. Installation
```bash
npm install
```

### 4. Running Development Server
Run both the Express backend API proxy and the Vite React frontend concurrently:
```bash
npm run dev
```
- Client interface: `http://localhost:5173`
- Backend API server: `http://localhost:3001`

### 5. Running Build & Tests
```bash
npm run build
npm test
```

---

## 🔌 API Endpoint Table

| Endpoint | Method | Description | Security / Validation |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & service status | Public |
| `/api/extract-invoice` | `POST` | Uploads invoice file for AI extraction | Magic bytes check, Temporary disk cleanup, XML prompt fencing |
| `/api/ocr-space` | `POST` | Direct OCR extraction fallback | Binary signature check |
| `/api/auth/login` | `POST` | Validates portal login credentials | Password validation (`9090`) |
| `/api/invoices/clear` | `POST` | Clears all registered invoices & items | Security password verification (`9090`) |
| `/api/invoices` | `GET` | Fetches registered invoices | Supabase integration |

---

## 🚀 Live Deployment Guide (Render)

This application is ready for 1-click deployment on [Render](https://render.com) as a Node Web Service.

### Option A: Using `render.yaml` (Blueprint)
1. Push your repository to GitHub.
2. In Render, select **Blueprints** → **New Blueprint Instance**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Enter your environment variables in the Render dashboard:
   - `OPENROUTER_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OCR_SPACE_API_KEY` (optional)
5. Click **Apply**.

### Option B: Manual Web Service
1. In Render, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `OPENROUTER_API_KEY`: *(your OpenRouter API key)*
   - `OPENROUTER_MODEL`: `dots-studio/dots-3-note-preview:free`
   - `AI_TIMEOUT_MS`: `45000`
   - `VITE_SUPABASE_URL`: `https://pfhwgpomzknsodsodufz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: *(your Supabase anon key)*
   - `SUPABASE_URL`: `https://pfhwgpomzknsodsodufz.supabase.co`
   - `SUPABASE_ANON_KEY`: *(your Supabase anon key)*
5. Click **Deploy Web Service**. Render will build the Vite frontend and serve both the static web app and API endpoints from a single URL.

