# Talastock Database Schema Reference

**Version:** 1.1  
**Last Updated:** 2026-04-16  
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

## 💳 Customer Credit Management Tables

### 8. customers
**Purpose:** Customer profiles with credit accounts for tracking "utang"

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | TEXT | NOT NULL | Customer full name |
| contact_number | TEXT | NULL | Customer contact number |
| address | TEXT | NULL | Customer address |
| business_name | TEXT | NULL | Customer business name |
| credit_limit | NUMERIC(10,2) | NOT NULL, DEFAULT 0, CHECK ≥ 0 | Maximum credit allowed |
| current_balance | NUMERIC(10,2) | NOT NULL, DEFAULT 0, CHECK ≥ 0 | Current outstanding balance |
| payment_terms_days | INTEGER | NOT NULL, DEFAULT 30, CHECK > 0 | Payment terms in days |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| notes | TEXT | NULL | Additional notes |
| created_by | UUID | FK → auth.users | User who created |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `name`
- Index on `is_active`
- Index on `created_by`
- Index on `created_at DESC`

**Triggers:**
- `trigger_customers_updated_at` - Auto-updates `updated_at`
- `trigger_update_balance_on_credit_sale` - Updates balance on credit sale changes
- `trigger_update_balance_on_payment` - Updates balance on payment changes

---

### 9. credit_sales
**Purpose:** Credit sales transactions linked to customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | NOT NULL, FK → customers | Customer reference |
| sale_id | UUID | FK → sales | Optional link to sales table |
| amount | NUMERIC(10,2) | NOT NULL, CHECK > 0 | Credit sale amount |
| due_date | DATE | NOT NULL | Payment due date |
| status | TEXT | NOT NULL, DEFAULT 'pending' | Payment status |
| notes | TEXT | NULL | Optional notes |
| created_by | UUID | FK → auth.users | User who created |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Valid Statuses:**
- `pending` - No payments yet
- `paid` - Fully paid
- `overdue` - Past due date and not paid
- `partially_paid` - Some payment received

**Indexes:**
- Primary key on `id`
- Index on `customer_id`
- Index on `sale_id`
- Index on `status`
- Index on `due_date`
- Index on `created_at DESC`
- Index on `created_by`

**Triggers:**
- `trigger_update_balance_on_credit_sale` - Updates customer balance
- `trigger_update_credit_sale_status_on_payment` - Updates status based on payments

---

### 10. payments
**Purpose:** Customer payment records against credit balances

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | NOT NULL, FK → customers | Customer reference |
| credit_sale_id | UUID | FK → credit_sales | Optional link to specific invoice |
| amount | NUMERIC(10,2) | NOT NULL, CHECK > 0 | Payment amount |
| payment_method | TEXT | NOT NULL, DEFAULT 'cash' | Payment method |
| payment_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Payment date |
| notes | TEXT | NULL | Optional notes |
| created_by | UUID | FK → auth.users | User who created |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Valid Payment Methods:**
- `cash` - Cash payment
- `bank_transfer` - Bank transfer
- `gcash` - GCash payment
- `paymaya` - PayMaya payment
- `other` - Other payment method

**Indexes:**
- Primary key on `id`
- Index on `customer_id`
- Index on `credit_sale_id`
- Index on `payment_date DESC`
- Index on `payment_method`
- Index on `created_by`

**Triggers:**
- `trigger_update_balance_on_payment` - Updates customer balance
- `trigger_update_credit_sale_status_on_payment` - Updates credit sale status

---

### 11. credit_limit_overrides
**Purpose:** Audit log for credit limit override events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customer_id | UUID | NOT NULL, FK → customers | Customer reference |
| credit_sale_id | UUID | NOT NULL, FK → credit_sales | Credit sale reference |
| previous_balance | NUMERIC(10,2) | NOT NULL | Balance before sale |
| sale_amount | NUMERIC(10,2) | NOT NULL | Amount of credit sale |
| new_balance | NUMERIC(10,2) | NOT NULL | Balance after sale |
| credit_limit | NUMERIC(10,2) | NOT NULL | Credit limit at time |
| override_reason | TEXT | NULL | Reason for override |
| created_by | UUID | FK → auth.users | User who approved |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Index on `customer_id`
- Index on `credit_sale_id`
- Index on `created_at DESC`

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

### customer_balances
Complete customer balance information with credit sales and payment summaries

```sql
SELECT * FROM customer_balances;
```

**Columns:**
- All customer columns
- `available_credit` - Credit limit minus current balance
- `total_credit_sales` - Sum of all credit sales
- `total_payments` - Sum of all payments
- `pending_amount` - Amount in pending status
- `overdue_amount` - Amount in overdue status

---

### overdue_accounts
List of overdue credit sales with customer information

```sql
SELECT * FROM overdue_accounts;
```

**Columns:**
- `customer_id`, `customer_name`, `contact_number`, `business_name`
- `credit_sale_id`, `sale_amount`, `due_date`
- `days_overdue` - Days past due date
- `status`, `amount_paid`, `amount_due`
- `sale_date`

---

### customers_near_limit
Customers who have used 80% or more of their credit limit

```sql
SELECT * FROM customers_near_limit;
```

**Columns:**
- `id`, `name`, `contact_number`, `business_name`
- `credit_limit`, `current_balance`, `available_credit`
- `utilization_percentage` - Percentage of credit limit used
- `is_active`

---

### credit_sales_with_details
Credit sales with customer details and payment information

```sql
SELECT * FROM credit_sales_with_details;
```

**Columns:**
- All credit_sales columns
- `customer_name`, `business_name`
- `amount_paid` - Total payments received
- `amount_remaining` - Amount still owed
- `days_overdue` - Days past due (0 if not overdue)

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

### calculate_customer_balance(customer_id)
Calculates current balance for a customer

```sql
SELECT calculate_customer_balance('customer-uuid-here');
-- Returns: Current balance (total credit sales - total payments)
```

---

### check_overdue_credit_sales()
Updates credit sale status to overdue for sales past due date

```sql
SELECT check_overdue_credit_sales();
-- Run daily via cron job
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

### Get customer balance summary
```sql
SELECT * FROM customer_balances
WHERE is_active = true
ORDER BY current_balance DESC;
```

### Get overdue accounts
```sql
SELECT * FROM overdue_accounts
ORDER BY days_overdue DESC;
```

### Get customers near credit limit
```sql
SELECT * FROM customers_near_limit
ORDER BY utilization_percentage DESC;
```

### Get customer statement
```sql
-- Credit sales for a customer
SELECT * FROM credit_sales_with_details
WHERE customer_id = 'customer-uuid-here'
ORDER BY created_at DESC;

-- Payments for a customer
SELECT * FROM payments
WHERE customer_id = 'customer-uuid-here'
ORDER BY payment_date DESC;
```

### Get total credit outstanding
```sql
SELECT SUM(current_balance) AS total_outstanding
FROM customers
WHERE is_active = true;
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

3. **create_customer_credit_management_schema.sql**
   - Creates complete customer credit management schema
   - Tables: customers, credit_sales, payments, credit_limit_overrides
   - Views: customer_balances, overdue_accounts, customers_near_limit, credit_sales_with_details
   - Functions: calculate_customer_balance, check_overdue_credit_sales
   - Triggers: Automatic balance updates and status tracking
   - Location: `database/migrations/`
   - Documentation: `database/migrations/CREDIT_MANAGEMENT_MIGRATION_README.md`

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

customers
    ↓ (1:N)        ↓ (1:N)
credit_sales   payments
    ↑ (N:1)
    └─ credit_limit_overrides (audit)
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

**Last Updated:** 2026-04-16  
**Maintained By:** Talastock Development Team

