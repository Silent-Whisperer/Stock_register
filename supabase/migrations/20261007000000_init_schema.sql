-- ============================================================================
-- Migration: 20261007000000_init_schema.sql
-- Description: Core schema for Normalized Invoice-to-Stock Management System
-- Tables: suppliers, products, invoices, invoice_items, stock_transactions
-- Features: RLS Policies, Constraints, Auto-timestamp triggers, Atomic Approval Function
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    state_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hsn_sac TEXT,
    unit TEXT NOT NULL DEFAULT 'PCS',
    purchase_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    supplier_gstin TEXT,
    buyer_name TEXT,
    buyer_gstin TEXT,
    total_taxable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_igst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING_APPROVAL',
    file_url TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    raw_extraction_json JSONB,
    discrepancies JSONB DEFAULT '[]'::jsonb,
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_description TEXT NOT NULL,
    hsn_sac TEXT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'PCS',
    unit_rate NUMERIC(12, 2) NOT NULL CHECK (unit_rate >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    confidence_score NUMERIC(3, 2),
    flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Stock Transactions Table
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INWARD', 'OUTWARD', 'ADJUSTMENT')),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_after NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-performance querying and pagination
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON public.invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON public.invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON public.stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created ON public.stock_transactions(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Default RLS Policies (Allow authenticated users full access)
CREATE POLICY "Allow authenticated read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write products" ON public.products FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write invoices" ON public.invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write invoice_items" ON public.invoice_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read stock_transactions" ON public.stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write stock_transactions" ON public.stock_transactions FOR ALL TO authenticated USING (true);

-- Allow public read/write if anon key is used in development mode
CREATE POLICY "Allow anon read suppliers" ON public.suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write suppliers" ON public.suppliers FOR ALL TO anon USING (true);

CREATE POLICY "Allow anon read products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write products" ON public.products FOR ALL TO anon USING (true);

CREATE POLICY "Allow anon read invoices" ON public.invoices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write invoices" ON public.invoices FOR ALL TO anon USING (true);

CREATE POLICY "Allow anon read invoice_items" ON public.invoice_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write invoice_items" ON public.invoice_items FOR ALL TO anon USING (true);

CREATE POLICY "Allow anon read stock_transactions" ON public.stock_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write stock_transactions" ON public.stock_transactions FOR ALL TO anon USING (true);

-- ============================================================================
-- Atomic Stored Procedure: approve_invoice_and_update_stock
-- Guarantees stock is mutated ONLY upon human approval, within a safe transaction.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_invoice_and_update_stock(
    p_invoice_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_new_stock NUMERIC(12, 2);
    v_sku TEXT;
    v_count INT := 0;
BEGIN
    -- 1. Fetch and lock invoice
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice with id % not found', p_invoice_id;
    END IF;

    IF v_invoice.status = 'APPROVED' THEN
        RAISE EXCEPTION 'Invoice % is already approved', v_invoice.invoice_number;
    END IF;

    -- 2. Mark invoice as APPROVED
    UPDATE public.invoices
    SET status = 'APPROVED',
        approved_at = now(),
        approved_by = p_user_id,
        updated_at = now()
    WHERE id = p_invoice_id;

    -- 3. Iterate through all items and update stock atomically
    FOR v_item IN
        SELECT * FROM public.invoice_items WHERE invoice_id = p_invoice_id
    LOOP
        -- Check if product exists or find by description/HSN
        IF v_item.product_id IS NOT NULL THEN
            SELECT * INTO v_prod FROM public.products WHERE id = v_item.product_id FOR UPDATE;
        ELSE
            SELECT * INTO v_prod FROM public.products WHERE name ILIKE v_item.item_description LIMIT 1 FOR UPDATE;
        END IF;

        IF v_prod.id IS NULL THEN
            -- Create product if not already cataloged
            v_sku := 'SKU-' || UPPER(SUBSTRING(REGEXP_REPLACE(v_item.item_description, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 4)) || '-' || TO_CHAR(now(), 'MI-SS');
            INSERT INTO public.products (
                sku,
                name,
                hsn_sac,
                unit,
                purchase_rate,
                selling_rate,
                current_stock,
                min_stock_alert
            ) VALUES (
                v_sku,
                v_item.item_description,
                v_item.hsn_sac,
                COALESCE(v_item.unit, 'PCS'),
                v_item.unit_rate,
                ROUND(v_item.unit_rate * 1.25, 2),
                v_item.quantity,
                10.00
            ) RETURNING * INTO v_prod;

            v_new_stock := v_item.quantity;

            -- Link created product to invoice item
            UPDATE public.invoice_items
            SET product_id = v_prod.id
            WHERE id = v_item.id;
        ELSE
            -- Increment existing stock
            v_new_stock := v_prod.current_stock + v_item.quantity;
            UPDATE public.products
            SET current_stock = v_new_stock,
                purchase_rate = v_item.unit_rate,
                updated_at = now()
            WHERE id = v_prod.id;

            -- Update link if missing
            IF v_item.product_id IS NULL THEN
                UPDATE public.invoice_items
                SET product_id = v_prod.id
                WHERE id = v_item.id;
            END IF;
        END IF;

        -- Record inward stock transaction in ledger
        INSERT INTO public.stock_transactions (
            product_id,
            invoice_id,
            transaction_type,
            quantity,
            unit_price,
            balance_after,
            notes,
            created_by
        ) VALUES (
            v_prod.id,
            p_invoice_id,
            'INWARD',
            v_item.quantity,
            v_item.unit_rate,
            v_new_stock,
            'Inward stock received from Invoice #' || v_invoice.invoice_number,
            p_user_id
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', p_invoice_id,
        'status', 'APPROVED',
        'items_processed', v_count
    );
END;
$$;
