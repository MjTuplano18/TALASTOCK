-- ============================================================================
-- Migration: Customer Credit Management Schema
-- ============================================================================
-- Date: 2026-04-16
-- Description: Creates complete schema for customer credit management feature
--              including customers, credit sales, payments, balance tracking,
--              and reporting capabilities.
--
-- Features:
--   1. Customer profiles with credit limits and payment terms
--   2. Credit sales tracking with due dates
--   3. Payment recording with multiple payment methods
--   4. Automatic balance calculation via triggers
--   5. Useful views for reporting (customer balances, overdue accounts)
--   6. Database functions for balance calculation
--   7. RLS policies for multi-tenant security
--
-- Requirements: Customer Credit Management Spec - All Data Requirements
-- ============================================================================

-- ============================================================================
-- TABLE: customers
-- ============================================================================

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

COMMENT ON TABLE customers IS 'Customer profiles with credit account information';
COMMENT ON COLUMN customers.name IS 'Customer full name (required)';
COMMENT ON COLUMN customers.contact_number IS 'Customer contact number (optional)';
COMMENT ON COLUMN customers.address IS 'Customer address (optional)';
COMMENT ON COLUMN customers.business_name IS 'Customer business name if applicable (optional)';
COMMENT ON COLUMN customers.credit_limit IS 'Maximum credit amount allowed for this customer';
COMMENT ON COLUMN customers.current_balance IS 'Current outstanding balance (auto-calculated)';
COMMENT ON COLUMN customers.payment_terms_days IS 'Payment terms in days (e.g., 7, 15, 30, 60)';
COMMENT ON COLUMN customers.is_active IS 'Whether customer account is active';
COMMENT ON COLUMN customers.notes IS 'Additional notes about the customer';

-- ============================================================================
-- TABLE: credit_sales
-- ============================================================================

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

COMMENT ON TABLE credit_sales IS 'Credit sales transactions linked to customers';
COMMENT ON COLUMN credit_sales.customer_id IS 'Customer who made the credit purchase';
COMMENT ON COLUMN credit_sales.sale_id IS 'Optional link to sales table for integrated sales';
COMMENT ON COLUMN credit_sales.amount IS 'Credit sale amount';
COMMENT ON COLUMN credit_sales.due_date IS 'Payment due date (calculated from payment terms)';
COMMENT ON COLUMN credit_sales.status IS 'Payment status: pending, paid, overdue, partially_paid';
COMMENT ON COLUMN credit_sales.notes IS 'Optional notes about the credit sale';

-- ============================================================================
-- TABLE: payments
-- ============================================================================

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

COMMENT ON TABLE payments IS 'Customer payment records against credit balances';
COMMENT ON COLUMN payments.customer_id IS 'Customer who made the payment';
COMMENT ON COLUMN payments.credit_sale_id IS 'Optional link to specific credit sale invoice';
COMMENT ON COLUMN payments.amount IS 'Payment amount';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: cash, bank_transfer, gcash, paymaya, other';
COMMENT ON COLUMN payments.payment_date IS 'Date payment was received';
COMMENT ON COLUMN payments.notes IS 'Optional notes about the payment';

-- ============================================================================
-- TABLE: credit_limit_overrides (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_limit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_sale_id UUID NOT NULL REFERENCES credit_sales(id) ON DELETE CASCADE,
  previous_balance NUMERIC(10,2) NOT NULL,
  sale_amount NUMERIC(10,2) NOT NULL,
  new_balance NUMERIC(10,2) NOT NULL,
  credit_limit NUMERIC(10,2) NOT NULL,
  override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credit_limit_overrides IS 'Audit log for credit limit override events';
COMMENT ON COLUMN credit_limit_overrides.previous_balance IS 'Customer balance before the sale';
COMMENT ON COLUMN credit_limit_overrides.sale_amount IS 'Amount of the credit sale';
COMMENT ON COLUMN credit_limit_overrides.new_balance IS 'Customer balance after the sale';
COMMENT ON COLUMN credit_limit_overrides.credit_limit IS 'Customer credit limit at time of override';
COMMENT ON COLUMN credit_limit_overrides.override_reason IS 'Reason for allowing the override';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Credit sales indexes
CREATE INDEX IF NOT EXISTS idx_credit_sales_customer_id ON credit_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_sales_sale_id ON credit_sales(sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_sales_status ON credit_sales(status);
CREATE INDEX IF NOT EXISTS idx_credit_sales_due_date ON credit_sales(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_sales_created_at ON credit_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_sales_created_by ON credit_sales(created_by);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_credit_sale_id ON payments(credit_sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);

-- Credit limit overrides indexes
CREATE INDEX IF NOT EXISTS idx_credit_limit_overrides_customer_id ON credit_limit_overrides(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_limit_overrides_credit_sale_id ON credit_limit_overrides(credit_sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_limit_overrides_created_at ON credit_limit_overrides(created_at DESC);

-- ============================================================================
-- FUNCTION: calculate_customer_balance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_customer_balance(p_customer_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_credit NUMERIC;
  v_total_payments NUMERIC;
  v_balance NUMERIC;
BEGIN
  -- Calculate total credit sales
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_credit
  FROM credit_sales
  WHERE customer_id = p_customer_id;
  
  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_payments
  FROM payments
  WHERE customer_id = p_customer_id;
  
  -- Calculate balance
  v_balance := v_total_credit - v_total_payments;
  
  RETURN GREATEST(v_balance, 0); -- Balance cannot be negative
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_customer_balance(UUID) IS 
  'Calculates current balance for a customer (total credit sales - total payments)';

-- ============================================================================
-- FUNCTION: update_customer_balance
-- ============================================================================

CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer's current_balance
  UPDATE customers
  SET 
    current_balance = calculate_customer_balance(
      CASE 
        WHEN TG_TABLE_NAME = 'credit_sales' THEN 
          COALESCE(NEW.customer_id, OLD.customer_id)
        WHEN TG_TABLE_NAME = 'payments' THEN 
          COALESCE(NEW.customer_id, OLD.customer_id)
      END
    ),
    updated_at = NOW()
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'credit_sales' THEN 
      COALESCE(NEW.customer_id, OLD.customer_id)
    WHEN TG_TABLE_NAME = 'payments' THEN 
      COALESCE(NEW.customer_id, OLD.customer_id)
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_customer_balance() IS 
  'Trigger function to automatically update customer balance on credit sale or payment';

-- ============================================================================
-- FUNCTION: update_credit_sale_status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_credit_sale_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid NUMERIC;
  v_sale_amount NUMERIC;
  v_is_overdue BOOLEAN;
BEGIN
  -- Get the credit sale amount
  SELECT amount INTO v_sale_amount
  FROM credit_sales
  WHERE id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  -- Calculate total payments for this credit sale
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM payments
  WHERE credit_sale_id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  -- Check if overdue
  SELECT (due_date < CURRENT_DATE) INTO v_is_overdue
  FROM credit_sales
  WHERE id = COALESCE(NEW.credit_sale_id, OLD.credit_sale_id);
  
  -- Update credit sale status
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

COMMENT ON FUNCTION update_credit_sale_status() IS 
  'Trigger function to automatically update credit sale status based on payments';

-- ============================================================================
-- FUNCTION: check_overdue_credit_sales
-- ============================================================================

CREATE OR REPLACE FUNCTION check_overdue_credit_sales()
RETURNS VOID AS $$
BEGIN
  -- Update status to 'overdue' for unpaid sales past due date
  UPDATE credit_sales
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
    AND status IN ('pending', 'partially_paid');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_overdue_credit_sales() IS 
  'Updates credit sale status to overdue for sales past due date. Run daily via cron.';

-- ============================================================================
-- TRIGGERS: Automatic Balance Updates
-- ============================================================================

-- Trigger: Update customer balance when credit sale is created/updated/deleted
CREATE TRIGGER trigger_update_balance_on_credit_sale
  AFTER INSERT OR UPDATE OR DELETE ON credit_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();

-- Trigger: Update customer balance when payment is created/updated/deleted
CREATE TRIGGER trigger_update_balance_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();

-- Trigger: Update credit sale status when payment is created/updated/deleted
CREATE TRIGGER trigger_update_credit_sale_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_sale_status();

-- Trigger: Auto-update customers updated_at
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEW: customer_balances
-- ============================================================================

CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  c.id,
  c.name,
  c.contact_number,
  c.business_name,
  c.credit_limit,
  c.current_balance,
  c.payment_terms_days,
  c.is_active,
  (c.credit_limit - c.current_balance) AS available_credit,
  COALESCE(cs.total_credit_sales, 0) AS total_credit_sales,
  COALESCE(p.total_payments, 0) AS total_payments,
  COALESCE(cs.pending_amount, 0) AS pending_amount,
  COALESCE(cs.overdue_amount, 0) AS overdue_amount,
  c.created_at,
  c.updated_at
FROM customers c
LEFT JOIN (
  SELECT 
    customer_id,
    SUM(amount) AS total_credit_sales,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount
  FROM credit_sales
  GROUP BY customer_id
) cs ON c.id = cs.customer_id
LEFT JOIN (
  SELECT 
    customer_id,
    SUM(amount) AS total_payments
  FROM payments
  GROUP BY customer_id
) p ON c.id = p.customer_id;

COMMENT ON VIEW customer_balances IS 
  'Complete customer balance information with credit sales and payment summaries';

-- ============================================================================
-- VIEW: overdue_accounts
-- ============================================================================

CREATE OR REPLACE VIEW overdue_accounts AS
SELECT 
  c.id AS customer_id,
  c.name AS customer_name,
  c.contact_number,
  c.business_name,
  cs.id AS credit_sale_id,
  cs.amount AS sale_amount,
  cs.due_date,
  (CURRENT_DATE - cs.due_date) AS days_overdue,
  cs.status,
  COALESCE(p.total_paid, 0) AS amount_paid,
  (cs.amount - COALESCE(p.total_paid, 0)) AS amount_due,
  cs.created_at AS sale_date
FROM credit_sales cs
JOIN customers c ON cs.customer_id = c.id
LEFT JOIN (
  SELECT 
    credit_sale_id,
    SUM(amount) AS total_paid
  FROM payments
  WHERE credit_sale_id IS NOT NULL
  GROUP BY credit_sale_id
) p ON cs.id = p.credit_sale_id
WHERE cs.status IN ('overdue', 'partially_paid')
  AND cs.due_date < CURRENT_DATE
  AND c.is_active = true
ORDER BY days_overdue DESC, cs.amount DESC;

COMMENT ON VIEW overdue_accounts IS 
  'List of overdue credit sales with customer information and days overdue';

-- ============================================================================
-- VIEW: customers_near_limit
-- ============================================================================

CREATE OR REPLACE VIEW customers_near_limit AS
SELECT 
  c.id,
  c.name,
  c.contact_number,
  c.business_name,
  c.credit_limit,
  c.current_balance,
  (c.credit_limit - c.current_balance) AS available_credit,
  ROUND((c.current_balance / NULLIF(c.credit_limit, 0) * 100), 2) AS utilization_percentage,
  c.is_active
FROM customers c
WHERE c.is_active = true
  AND c.credit_limit > 0
  AND (c.current_balance / c.credit_limit) >= 0.80
ORDER BY utilization_percentage DESC;

COMMENT ON VIEW customers_near_limit IS 
  'Customers who have used 80% or more of their credit limit';

-- ============================================================================
-- VIEW: credit_sales_with_details
-- ============================================================================

CREATE OR REPLACE VIEW credit_sales_with_details AS
SELECT 
  cs.id,
  cs.customer_id,
  c.name AS customer_name,
  c.business_name,
  cs.sale_id,
  cs.amount,
  cs.due_date,
  cs.status,
  cs.notes,
  COALESCE(p.total_paid, 0) AS amount_paid,
  (cs.amount - COALESCE(p.total_paid, 0)) AS amount_remaining,
  CASE 
    WHEN cs.due_date < CURRENT_DATE AND cs.status != 'paid' 
    THEN (CURRENT_DATE - cs.due_date)
    ELSE 0
  END AS days_overdue,
  cs.created_by,
  cs.created_at
FROM credit_sales cs
JOIN customers c ON cs.customer_id = c.id
LEFT JOIN (
  SELECT 
    credit_sale_id,
    SUM(amount) AS total_paid
  FROM payments
  WHERE credit_sale_id IS NOT NULL
  GROUP BY credit_sale_id
) p ON cs.id = p.credit_sale_id;

COMMENT ON VIEW credit_sales_with_details IS 
  'Credit sales with customer details and payment information';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_limit_overrides ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: customers
-- ============================================================================

CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: credit_sales
-- ============================================================================

CREATE POLICY "Authenticated users can read credit_sales"
  ON credit_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert credit_sales"
  ON credit_sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update credit_sales"
  ON credit_sales FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete credit_sales"
  ON credit_sales FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: payments
-- ============================================================================

CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: credit_limit_overrides
-- ============================================================================

CREATE POLICY "Authenticated users can read credit_limit_overrides"
  ON credit_limit_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert credit_limit_overrides"
  ON credit_limit_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_customer_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_credit_sales() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY table_name;

-- Verify all indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY tablename, indexname;

-- Verify all triggers were created
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customers', 'credit_sales', 'payments')
ORDER BY event_object_table, trigger_name;

-- Verify all views were created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('customer_balances', 'overdue_accounts', 'customers_near_limit', 'credit_sales_with_details')
ORDER BY table_name;

-- Verify RLS policies were created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY tablename, policyname;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample customer
INSERT INTO customers (name, contact_number, credit_limit, payment_terms_days, created_by)
VALUES ('Juan Dela Cruz', '09171234567', 10000.00, 30, auth.uid());

-- Insert sample credit sale
INSERT INTO credit_sales (customer_id, amount, due_date, created_by)
SELECT id, 5000.00, CURRENT_DATE + INTERVAL '30 days', auth.uid()
FROM customers
WHERE name = 'Juan Dela Cruz'
LIMIT 1;

-- Insert sample payment
INSERT INTO payments (customer_id, amount, payment_method, created_by)
SELECT id, 2000.00, 'cash', auth.uid()
FROM customers
WHERE name = 'Juan Dela Cruz'
LIMIT 1;
*/

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run the following:

-- Drop views
DROP VIEW IF EXISTS credit_sales_with_details;
DROP VIEW IF EXISTS customers_near_limit;
DROP VIEW IF EXISTS overdue_accounts;
DROP VIEW IF EXISTS customer_balances;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;

-- Drop functions
DROP FUNCTION IF EXISTS check_overdue_credit_sales();
DROP FUNCTION IF EXISTS update_credit_sale_status();
DROP FUNCTION IF EXISTS update_customer_balance();
DROP FUNCTION IF EXISTS calculate_customer_balance(UUID);

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS credit_limit_overrides;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS credit_sales;
DROP TABLE IF EXISTS customers;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration completed successfully
SELECT 'Migration completed: create_customer_credit_management_schema.sql' AS status;
