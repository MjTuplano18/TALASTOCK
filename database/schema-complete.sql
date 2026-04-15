-- ============================================================================
-- TALASTOCK COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Last Updated: 2026-04-15
-- Description: Complete database schema including all tables, indexes, 
--              triggers, RLS policies, and migrations
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Categories
-- Stores product categories for organization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories for inventory organization';
COMMENT ON COLUMN categories.name IS 'Unique category name';

-- ============================================================================

-- 2. Products
-- Main product catalog with pricing and metadata
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Product catalog with pricing and metadata';
COMMENT ON COLUMN products.sku IS 'Unique stock keeping unit identifier';
COMMENT ON COLUMN products.price IS 'Retail selling price';
COMMENT ON COLUMN products.cost_price IS 'Cost/purchase price';
COMMENT ON COLUMN products.is_active IS 'Whether product is active in catalog';

-- ============================================================================

-- 3. Inventory
-- Current stock levels and thresholds
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory IS 'Current stock levels and low stock thresholds';
COMMENT ON COLUMN inventory.quantity IS 'Current stock quantity';
COMMENT ON COLUMN inventory.low_stock_threshold IS 'Alert threshold for low stock';

-- ============================================================================

-- 4. Stock Movements
-- Historical record of all inventory changes
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback')),
  quantity INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  import_history_id UUID REFERENCES import_history(id) ON DELETE SET NULL
);

COMMENT ON TABLE stock_movements IS 'Audit trail of all inventory changes';
COMMENT ON COLUMN stock_movements.type IS 'Type of movement: restock, sale, adjustment, return, import, rollback';
COMMENT ON COLUMN stock_movements.quantity IS 'Quantity changed (positive or negative)';
COMMENT ON COLUMN stock_movements.import_history_id IS 'Reference to import operation (if applicable)';

-- ============================================================================

-- 5. Sales
-- Sales transactions header
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sales IS 'Sales transaction headers';
COMMENT ON COLUMN sales.total_amount IS 'Total sale amount';

-- ============================================================================

-- 6. Sale Items
-- Line items for each sale
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

COMMENT ON TABLE sale_items IS 'Line items for sales transactions';
COMMENT ON COLUMN sale_items.subtotal IS 'Calculated subtotal (quantity × unit_price)';

-- ============================================================================

-- 7. Import History (v2 Feature)
-- Tracks all inventory import operations with rollback capability
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  mode TEXT CHECK (mode IN ('replace', 'add')) NOT NULL,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')) NOT NULL,
  rollback_available BOOLEAN DEFAULT TRUE,
  rollback_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE import_history IS 'Tracks all inventory import operations with rollback capability (v2 feature)';
COMMENT ON COLUMN import_history.mode IS 'Import mode: replace (set to value) or add (add to current)';
COMMENT ON COLUMN import_history.status IS 'Import status: success, partial (some errors), or failed';
COMMENT ON COLUMN import_history.rollback_available IS 'Whether this import can be rolled back';
COMMENT ON COLUMN import_history.rollback_deadline IS 'Deadline for rollback (typically 24 hours after import)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_import_history_id ON stock_movements(import_history_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Import history indexes
CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_timestamp ON import_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_rollback ON import_history(rollback_available, rollback_deadline) 
  WHERE rollback_available = TRUE;

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Automatically updates updated_at column to current timestamp';

-- ============================================================================

-- Function: Auto-create inventory record when product is created
CREATE OR REPLACE FUNCTION create_inventory_on_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity, low_stock_threshold)
  VALUES (NEW.id, 0, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_inventory_on_product() IS 'Automatically creates inventory record when new product is added';

-- ============================================================================

-- Trigger: Auto-create inventory on product insert
CREATE TRIGGER IF NOT EXISTS trigger_create_inventory
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_on_product();

-- ============================================================================

-- Trigger: Auto-update products.updated_at
CREATE TRIGGER IF NOT EXISTS trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================

-- Trigger: Auto-update inventory.updated_at
CREATE TRIGGER IF NOT EXISTS trigger_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Categories Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- Products Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- Inventory Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- Stock Movements Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================================================
-- Sales Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read sales"
  ON sales FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (TRUE);

-- ============================================================================
-- Sale Items Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Authenticated users can read sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================================================
-- Import History Policies
-- ============================================================================

CREATE POLICY IF NOT EXISTS "Users can view their own import history"
  ON import_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own import history"
  ON import_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own import history"
  ON import_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Products with inventory and category information
CREATE OR REPLACE VIEW products_with_inventory AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.price,
  p.cost_price,
  p.is_active,
  p.created_at,
  p.updated_at,
  c.name AS category_name,
  c.id AS category_id,
  i.quantity,
  i.low_stock_threshold,
  i.updated_at AS inventory_updated_at,
  CASE 
    WHEN i.quantity = 0 THEN 'out_of_stock'
    WHEN i.quantity <= i.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id;

COMMENT ON VIEW products_with_inventory IS 'Products with inventory levels and stock status';

-- ============================================================================

-- View: Sales with items and totals
CREATE OR REPLACE VIEW sales_with_details AS
SELECT 
  s.id AS sale_id,
  s.total_amount,
  s.notes,
  s.created_by,
  s.created_at,
  COUNT(si.id) AS item_count,
  SUM(si.quantity) AS total_items,
  json_agg(
    json_build_object(
      'product_id', si.product_id,
      'product_name', p.name,
      'quantity', si.quantity,
      'unit_price', si.unit_price,
      'subtotal', si.subtotal
    )
  ) AS items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
LEFT JOIN products p ON si.product_id = p.id
GROUP BY s.id, s.total_amount, s.notes, s.created_by, s.created_at;

COMMENT ON VIEW sales_with_details IS 'Sales with aggregated item details';

-- ============================================================================

-- View: Low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  i.quantity,
  i.low_stock_threshold,
  c.name AS category_name
FROM products p
JOIN inventory i ON p.id = i.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.quantity <= i.low_stock_threshold
  AND p.is_active = TRUE
ORDER BY i.quantity ASC;

COMMENT ON VIEW low_stock_products IS 'Products at or below low stock threshold';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get stock status for a product
CREATE OR REPLACE FUNCTION get_stock_status(product_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  current_qty INTEGER;
  threshold INTEGER;
BEGIN
  SELECT quantity, low_stock_threshold 
  INTO current_qty, threshold
  FROM inventory 
  WHERE product_id = product_id_param;
  
  IF current_qty = 0 THEN
    RETURN 'out_of_stock';
  ELSIF current_qty <= threshold THEN
    RETURN 'low_stock';
  ELSE
    RETURN 'in_stock';
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_stock_status(UUID) IS 'Returns stock status for a given product';

-- ============================================================================

-- Function: Get inventory value
CREATE OR REPLACE FUNCTION get_inventory_value()
RETURNS NUMERIC AS $$
DECLARE
  total_value NUMERIC;
BEGIN
  SELECT SUM(i.quantity * p.cost_price)
  INTO total_value
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  WHERE p.is_active = TRUE;
  
  RETURN COALESCE(total_value, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_inventory_value() IS 'Calculates total inventory value based on cost price';

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment to insert sample data

/*
-- Sample Categories
INSERT INTO categories (name) VALUES 
  ('Electronics'),
  ('Hardware'),
  ('Office Supplies'),
  ('Food & Beverage')
ON CONFLICT (name) DO NOTHING;

-- Sample Products
INSERT INTO products (name, sku, category_id, price, cost_price) 
SELECT 
  'Sample Product ' || i,
  'SKU' || LPAD(i::TEXT, 5, '0'),
  (SELECT id FROM categories ORDER BY RANDOM() LIMIT 1),
  (RANDOM() * 1000 + 100)::NUMERIC(10,2),
  (RANDOM() * 500 + 50)::NUMERIC(10,2)
FROM generate_series(1, 10) AS i
ON CONFLICT (sku) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('categories', 'products', 'inventory', 'stock_movements', 'sales', 'sale_items', 'import_history')
ORDER BY table_name;

-- Verify all indexes exist
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'products', 'inventory', 'stock_movements', 'sales', 'sale_items', 'import_history')
ORDER BY tablename, indexname;

-- Verify all triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Schema version and metadata
COMMENT ON SCHEMA public IS 'Talastock Database Schema v1.0 - Last updated: 2026-04-15';

