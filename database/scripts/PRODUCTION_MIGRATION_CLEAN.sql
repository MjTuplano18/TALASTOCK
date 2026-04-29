-- ============================================================================
-- Production Migration: Clean Install of Credit Management
-- ============================================================================
-- This script safely drops existing objects and recreates them
-- Safe to run multiple times
-- ============================================================================

-- Step 1: Drop existing triggers (if they exist)
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

-- Step 2: Drop existing functions (if they exist)
DROP FUNCTION IF EXISTS update_customer_balance() CASCADE;
DROP FUNCTION IF EXISTS update_credit_sale_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_customer_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_overdue_credit_sales() CASCADE;

-- Step 3: Drop existing views (if they exist)
DROP VIEW IF EXISTS credit_sales_with_details CASCADE;
DROP VIEW IF EXISTS customers_near_limit CASCADE;
DROP VIEW IF EXISTS overdue_accounts CASCADE;
DROP VIEW IF EXISTS customer_balances CASCADE;

-- Step 4: Create tables (IF NOT EXISTS - won't fail if they exist)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_number TEXT,
  address TEXT,
  business_name TEXT,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  payment_terms_days INTEGER NOT NULL DEFAULT 30 CHECK (payment_terms_days > 0),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'gcash', 'paymaya', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_limit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_sale_id UUID NOT NULL REFERENCES credit_sales(id) ON DELETE CASCADE,
  previous_balance NUMERIC(10,2) NOT NULL,
  sale_amount NUMERIC(10,2) NOT NULL,
  new_balance NUMERIC(10,2) NOT NULL,
  credit_limit NUMERIC(10,2) NOT NULL,
  old_credit_limit NUMERIC(10,2),
  new_credit_limit NUMERIC(10,2),
  override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_credit_sales_customer_id ON credit_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_sales_status ON credit_sales(status);
CREATE INDEX IF NOT EXISTS idx_credit_sales_due_date ON credit_sales(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_credit_sale_id ON payments(credit_sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- Step 6: Create functions
CREATE OR REPLACE FUNCTION calculate_customer_balance(p_customer_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_credit NUMERIC;
  v_total_payments NUMERIC;
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_credit
  FROM credit_sales WHERE customer_id = p_customer_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
  FROM payments WHERE customer_id = p_customer_id;
  
  v_balance := v_total_credit - v_total_payments;
  RETURN GREATEST(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET 
    current_balance = calculate_customer_balance(
      CASE 
        WHEN TG_TABLE_NAME = 'credit_sales' THEN COALESCE(NEW.customer_id, OLD.customer_id)
        WHEN TG_TABLE_NAME = 'payments' THEN COALESCE(NEW.customer_id, OLD.customer_id)
      END
    ),
    updated_at = NOW()
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'credit_sales' THEN COALESCE(NEW.customer_id, OLD.customer_id)
    WHEN TG_TABLE_NAME = 'payments' THEN COALESCE(NEW.customer_id, OLD.customer_id)
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_credit_sale_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid NUMERIC;
  v_sale_amount NUMERIC;
  v_is_overdue BOOLEAN;
BEGIN
  SELECT amount INTO v_sale_amount
  FROM credit_sales WHERE id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments WHERE credit_sale_id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  SELECT (due_date < CURRENT_DATE) INTO v_is_overdue
  FROM credit_sales WHERE id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  UPDATE credit_sales
  SET status = CASE
    WHEN v_total_paid >= v_sale_amount THEN 'paid'
    WHEN v_total_paid > 0 AND v_total_paid < v_sale_amount THEN 'partially_paid'
    WHEN v_is_overdue THEN 'overdue'
    ELSE 'pending'
  END
  WHERE id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_overdue_credit_sales()
RETURNS VOID AS $$
BEGIN
  UPDATE credit_sales
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE AND status IN ('pending', 'partially_paid');
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers (fresh)
CREATE TRIGGER trigger_update_balance_on_credit_sale
  AFTER INSERT OR UPDATE OR DELETE ON credit_sales
  FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

CREATE TRIGGER trigger_update_balance_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

CREATE TRIGGER trigger_update_credit_sale_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_credit_sale_status();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 8: Create views
CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  c.id, c.name, c.contact_number, c.business_name,
  c.credit_limit, c.current_balance, c.payment_terms_days, c.is_active,
  (c.credit_limit - c.current_balance) AS available_credit,
  COALESCE(cs.total_credit_sales, 0) AS total_credit_sales,
  COALESCE(p.total_payments, 0) AS total_payments,
  COALESCE(cs.pending_amount, 0) AS pending_amount,
  COALESCE(cs.overdue_amount, 0) AS overdue_amount,
  c.created_at, c.updated_at
FROM customers c
LEFT JOIN (
  SELECT customer_id,
    SUM(amount) AS total_credit_sales,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount
  FROM credit_sales GROUP BY customer_id
) cs ON c.id = cs.customer_id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS total_payments
  FROM payments GROUP BY customer_id
) p ON c.id = p.customer_id;

-- Step 9: Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_limit_overrides ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies (DROP IF EXISTS first)
DROP POLICY IF EXISTS "Authenticated users can read customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE TO authenticated USING (true);

-- Credit sales policies
DROP POLICY IF EXISTS "Authenticated users can read credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can insert credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can update credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can delete credit_sales" ON credit_sales;

CREATE POLICY "Authenticated users can read credit_sales"
  ON credit_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert credit_sales"
  ON credit_sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update credit_sales"
  ON credit_sales FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete credit_sales"
  ON credit_sales FOR DELETE TO authenticated USING (true);

-- Payments policies
DROP POLICY IF EXISTS "Authenticated users can read payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;

CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE TO authenticated USING (true);

-- Credit limit overrides policies
DROP POLICY IF EXISTS "Authenticated users can read credit_limit_overrides" ON credit_limit_overrides;
DROP POLICY IF EXISTS "Authenticated users can insert credit_limit_overrides" ON credit_limit_overrides;

CREATE POLICY "Authenticated users can read credit_limit_overrides"
  ON credit_limit_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert credit_limit_overrides"
  ON credit_limit_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Step 11: Grant permissions
GRANT EXECUTE ON FUNCTION calculate_customer_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_credit_sales() TO authenticated;

-- Step 12: Verification
SELECT 'Migration completed successfully!' AS status,
       (SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')) AS tables_created,
       (SELECT COUNT(*) FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND event_object_table IN ('customers', 'credit_sales', 'payments')) AS triggers_created,
       (SELECT COUNT(*) FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')) AS policies_created;
