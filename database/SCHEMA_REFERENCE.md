# Talastock Database Schema Reference

**Version:** 1.0  
**Last Updated:** 2026-04-15  
**Database:** PostgreSQL (Supabase)

---

## 📋 Quick Reference

### Complete Schema File
**Location:** `database/schema-complete.sql`

This file contains:
- All table definitions
- All indexes
- All triggers and functions
- All RLS policies
- Useful views
- Helper functions
- Verification queries

---

## 📊 Database Tables

### 1. categories
**Purpose:** Product categories for organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | TEXT | NOT NULL, UNIQUE | Category name |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique constraint on `name`

---

### 2. products
**Purpose:** Main product catalog with pricing and metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | TEXT | NOT NULL | Product name |
| sku | TEXT | NOT NULL, UNIQUE | Stock keeping unit |
| category_id | UUID | FK → categories | Category reference |
| price | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Retail price |
| cost_price | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Cost/purchase price |
| image_url | TEXT | NULL | Product image URL |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `sku`
- Index on `category_id`
- Index on `is_active`
- Index on `created_at DESC`

**Triggers:**
- `trigger_create_inventory` - Auto-creates inventory record
- `trigger_products_updated_at` - Auto-updates `updated_at`

---

### 3. inventory
**Purpose:** Current stock levels and thresholds

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| product_id | UUID | FK → products, UNIQUE | Product reference |
| quantity | INTEGER | NOT NULL, DEFAULT 0 | Current stock quantity |
| low_stock_threshold | INTEGER | NOT NULL, DEFAULT 10 | Low stock alert threshold |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique constraint on `product_id`
- Index on `quantity`

**Triggers:**
- `trigger_inventory_updated_at` - Auto-updates `updated_at`

---

### 4. stock_movements
**Purpose:** Audit trail of all inventory changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| product_id | UUID | FK → products | Product reference |
| type | TEXT | CHECK constraint | Movement type |
| quantity | INTEGER | NOT NULL | Quantity changed |
| note | TEXT | NULL | Optional note |
| created_by | UUID | FK → auth.users | User who created |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| import_history_id | UUID | FK → import_history | Import reference (v2) |

**Valid Types:**
- `restock` - Restocking inventory
- `sale` - Sale transaction
- `adjustment` - Manual adjustment
- `return` - Product return
- `import` - Bulk import (v1)
- `rollback` - Import rollback (v2)

**Indexes:**
- Primary key on `id`
- Index on `product_id`
- Index on `created_at DESC`
- Index on `type`
- Index on `created_by`
- Index on `import_history_id`

---

### 5. sales
**Purpose:** Sales transaction headers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| total_amount | NUMERIC(10,2) | NOT NULL | Total sale amount |
| notes | TEXT | NULL | Optional notes |
| created_by | UUID | FK → auth.users | User who created |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Index on `created_at DESC`
- Index on `created_by`

---

### 6. sale_items
**Purpose:** Line items for sales transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| sale_id | UUID | FK → sales | Sale reference |
| product_id | UUID | FK → products | Product reference |
| quantity | INTEGER | NOT NULL | Quantity sold |
| unit_price | NUMERIC(10,2) | NOT NULL | Price per unit |
| subtotal | NUMERIC(10,2) | GENERATED | Calculated subtotal |

**Indexes:**
- Primary key on `id`
- Index on `sale_id`
- Index on `product_id`

**Computed Columns:**
- `subtotal` = `quantity` × `unit_price` (auto-calculated)

---

### 7. import_history (v2 Feature)
**Purpose:** Track inventory import operations with rollback capability

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK → auth.users, NOT NULL | User who imported |
| filename | TEXT | NOT NULL | Imported filename |
| timestamp | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Import timestamp |
| rows_imported | INTEGER | NOT NULL, DEFAULT 0 | Successful rows |
| rows_skipped | INTEGER | NOT NULL, DEFAULT 0 | Skipped rows |
| mode | TEXT | CHECK constraint | Import mode |
| status | TEXT | CHECK constraint | Import status |
| rollback_available | BOOLEAN | DEFAULT TRUE | Can rollback? |
| rollback_deadline | TIMESTAMPTZ | NULL | Rollback deadline |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Valid Modes:**
- `replace` - Set quantity to imported value
- `add` - Add imported value to current quantity

**Valid Statuses:**
- `success` - All rows imported
- `partial` - Some rows skipped
- `failed` - Import failed

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `timestamp DESC`
- Partial index on `rollback_available, rollback_deadline`

---

## 🔍 Useful Views

### products_with_inventory
Complete product information with inventory and stock status

```sql
SELECT * FROM products_with_inventory;
```

**Columns:**
- All product columns
- `category_name`
- `quantity`
- `low_stock_threshold`
- `stock_status` (calculated: `in_stock`, `low_stock`, `out_of_stock`)

---

### sales_with_details
Sales with aggregated item details

```sql
SELECT * FROM sales_with_details;
```

**Columns:**
- All sale columns
- `item_count` - Number of line items
- `total_items` - Total quantity sold
- `items` - JSON array of sale items

---

### low_stock_products
Products at or below low stock threshold

```sql
SELECT * FROM low_stock_products;
```

**Columns:**
- `id`, `name`, `sku`
- `quantity`, `low_stock_threshold`
- `category_name`

---

## 🔧 Helper Functions

### get_stock_status(product_id)
Returns stock status for a product

```sql
SELECT get_stock_status('product-uuid-here');
-- Returns: 'in_stock', 'low_stock', or 'out_of_stock'
```

---

### get_inventory_value()
Calculates total inventory value based on cost price

```sql
SELECT get_inventory_value();
-- Returns: Total inventory value (NUMERIC)
```

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### General Pattern
- **Authenticated users** can read all records
- **Authenticated users** can insert/update/delete their own records
- **import_history** is restricted to user's own records only

### Policy Names
- `"Authenticated users can read [table]"`
- `"Authenticated users can insert [table]"`
- `"Authenticated users can update [table]"`
- `"Authenticated users can delete [table]"`
- `"Users can view their own import history"` (import_history only)

---

## 🚀 Common Queries

### Get all products with inventory
```sql
SELECT * FROM products_with_inventory
WHERE is_active = TRUE
ORDER BY name;
```

### Get low stock products
```sql
SELECT * FROM low_stock_products;
```

### Get recent stock movements for a product
```sql
SELECT * FROM stock_movements
WHERE product_id = 'product-uuid-here'
ORDER BY created_at DESC
LIMIT 10;
```

### Get sales for today
```sql
SELECT * FROM sales_with_details
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### Get import history for current user
```sql
SELECT * FROM import_history
WHERE user_id = auth.uid()
ORDER BY timestamp DESC;
```

### Get total inventory value
```sql
SELECT get_inventory_value() AS total_value;
```

### Get products by category
```sql
SELECT p.*, c.name AS category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Electronics'
  AND p.is_active = TRUE;
```

### Get top selling products
```sql
SELECT 
  p.name,
  p.sku,
  SUM(si.quantity) AS total_sold,
  SUM(si.subtotal) AS total_revenue
FROM sale_items si
JOIN products p ON si.product_id = p.id
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC
LIMIT 10;
```

---

## 📝 Migration Files

### Current Migrations

1. **add_import_type_to_stock_movements.sql**
   - Adds 'import' and 'rollback' types to stock_movements
   - Required for v1 import feature
   - Location: `database/migrations/`

2. **create_import_history_table.sql**
   - Creates import_history table
   - Required for v2 features (history, rollback)
   - Location: `docs/database/migrations/`

---

## 🔄 Schema Updates

### To Apply Complete Schema
```sql
-- Run in Supabase SQL Editor
\i database/schema-complete.sql
```

### To Apply Specific Migration
```sql
-- Run in Supabase SQL Editor
\i database/migrations/add_import_type_to_stock_movements.sql
```

---

## ✅ Verification

### Check all tables exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Check all indexes
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check all triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Check RLS policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 📊 Entity Relationship Diagram

```
categories
    ↓ (1:N)
products ←→ inventory (1:1)
    ↓ (1:N)        ↓ (1:N)
sale_items    stock_movements
    ↓ (N:1)
sales

import_history (v2)
    ↓ (1:N)
stock_movements
```

---

## 🎯 Best Practices

1. **Always use transactions** for multi-table operations
2. **Use views** for complex queries instead of joining in application
3. **Leverage RLS** for security instead of application-level checks
4. **Use indexes** for frequently queried columns
5. **Monitor query performance** with `EXPLAIN ANALYZE`
6. **Keep audit trail** via stock_movements for all inventory changes
7. **Use helper functions** for common calculations
8. **Backup regularly** before schema changes

---

## 📚 Additional Resources

- **Complete Schema:** `database/schema-complete.sql`
- **Migrations:** `database/migrations/`
- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Last Updated:** 2026-04-15  
**Maintained By:** Talastock Development Team

