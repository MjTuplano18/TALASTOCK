-- ============================================================================
-- Simple Production Migration: Credit Management
-- ============================================================================
-- Run this after cleanup
-- Creates everything in the correct order
-- ============================================================================

-- Step 1: Create tables
CREATE TABLE customers (
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

CREATE TABLE credit_sales (
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

CREATE TABLE payments (
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

CREATE TABLE credit_limit_overrides (
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

-- Step 2: Create indexes
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_credit_sales_customer_id ON credit_sales(customer_id);
CREATE INDEX idx_credit_sales_status ON credit_sales(status);
CREATE INDEX idx_credit_sales_due_date ON credit_sales(due_date);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_credit_sale_id ON payments(credit_sale_id);

-- Step 3: Create functions
CREATE FUNCTION calculate_customer_balance(p_customer_id UUID)
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

CREATE FUNCTION update_customer_balance()
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

CREATE FUNCTION update_credit_sale_status()
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

-- Step 4: Create triggers
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

-- Step 5: Create view
CREATE VIEW customer_balances AS
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

-- Step 6: Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_limit_overrides ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read credit_sales"
  ON credit_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert credit_sales"
  ON credit_sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update credit_sales"
  ON credit_sales FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete credit_sales"
  ON credit_sales FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read credit_limit_overrides"
  ON credit_limit_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert credit_limit_overrides"
  ON credit_limit_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION calculate_customer_balance(UUID) TO authenticated;

-- Verification
SELECT 'Migration completed successfully!' AS status;
