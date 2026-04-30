-- ============================================================================
-- Fix: Remove Duplicate Triggers
-- ============================================================================
-- Problem: Triggers were created multiple times, causing duplicates
-- Solution: Drop all triggers and recreate them once
-- ============================================================================

-- Step 1: Drop all existing triggers
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

-- Step 2: Verify triggers are gone (should return 0 rows)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customers', 'credit_sales', 'payments');

-- Step 3: Recreate the functions (in case they need updating)

-- Function: update_customer_balance
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

-- Function: update_credit_sale_status
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

-- Step 4: Recreate triggers (ONE TIME ONLY)

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

-- Step 5: Verify triggers are created correctly (should return exactly 4 rows)
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customers', 'credit_sales', 'payments')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- Status
-- ============================================================================

SELECT 'Duplicate triggers fixed! You should see exactly 4 triggers above.' AS status;
