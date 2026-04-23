-- ============================================================================
-- Create decrement_inventory RPC Function
-- ============================================================================
-- Purpose: Safely decrement inventory quantity for a product
-- Used by: POS system when recording sales
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update inventory by decrementing the quantity
  UPDATE inventory
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in inventory: %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_inventory(UUID, INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION decrement_inventory(UUID, INTEGER) IS 
  'Decrements inventory quantity for a product. Used by POS system when recording sales.';

-- ============================================================================
-- Verification
-- ============================================================================

-- Test the function (optional - comment out in production)
-- SELECT decrement_inventory('some-product-id'::UUID, 5);

-- ============================================================================
-- Rollback
-- ============================================================================

-- To remove this function, run:
-- DROP FUNCTION IF EXISTS decrement_inventory(UUID, INTEGER);
