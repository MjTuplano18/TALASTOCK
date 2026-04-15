# Talastock Database Documentation

**Version:** 1.0  
**Last Updated:** 2026-04-15

---

## 📁 Files in This Directory

### 1. schema-complete.sql ⭐
**The master schema file containing everything you need**

This single file includes:
- ✅ All 7 table definitions
- ✅ All indexes for performance
- ✅ All triggers and functions
- ✅ All RLS policies
- ✅ Useful views (products_with_inventory, sales_with_details, low_stock_products)
- ✅ Helper functions (get_stock_status, get_inventory_value)
- ✅ Verification queries
- ✅ Sample data (commented out)

**Use this file to:**
- Set up a new database from scratch
- Understand the complete database structure
- Reference all tables, columns, and relationships

---

### 2. SCHEMA_REFERENCE.md 📖
**Quick reference guide for developers**

Contains:
- Table descriptions with all columns
- Index information
- Trigger documentation
- RLS policy details
- Common queries
- Best practices
- Entity relationship diagram

**Use this file to:**
- Quickly look up table structures
- Find common query patterns
- Understand relationships between tables
- Learn best practices

---

### 3. migrations/ 📂
**Database migration files**

Contains:
- `add_import_type_to_stock_movements.sql` - Adds 'import' and 'rollback' types (v1)

**Use these files to:**
- Update existing databases
- Track schema changes over time
- Apply incremental updates

---

## 🚀 Quick Start

### For New Database Setup

1. **Open Supabase SQL Editor**
2. **Run the complete schema:**
   ```sql
   -- Copy and paste contents of schema-complete.sql
   ```
3. **Verify installation:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
   ```

### For Existing Database (Apply Migrations)

1. **Check current schema version**
2. **Apply missing migrations in order:**
   ```sql
   -- Run migration files from migrations/ folder
   ```

---

## 📊 Database Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **categories** | Product categories | Simple lookup table |
| **products** | Product catalog | SKU, pricing, active status |
| **inventory** | Stock levels | Quantity, low stock threshold |
| **stock_movements** | Audit trail | All inventory changes logged |
| **sales** | Sales headers | Transaction totals |
| **sale_items** | Sale line items | Calculated subtotals |
| **import_history** | Import tracking (v2) | Rollback capability |

---

## 🔗 Relationships

```
categories (1) ──→ (N) products
products (1) ──→ (1) inventory
products (1) ──→ (N) stock_movements
products (1) ──→ (N) sale_items
sales (1) ──→ (N) sale_items
import_history (1) ──→ (N) stock_movements
auth.users (1) ──→ (N) stock_movements
auth.users (1) ──→ (N) sales
auth.users (1) ──→ (N) import_history
```

---

## 🔐 Security Features

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Authenticated access only** - No public access
- ✅ **User-scoped policies** for import_history
- ✅ **Audit trail** via stock_movements
- ✅ **Soft deletes** via is_active flag on products

---

## ⚡ Performance Features

- ✅ **15+ indexes** for fast queries
- ✅ **Materialized views** for complex queries
- ✅ **Computed columns** (subtotal in sale_items)
- ✅ **Efficient foreign keys** with proper cascading
- ✅ **Optimized for common queries** (recent sales, low stock, etc.)

---

## 🔧 Automation Features

- ✅ **Auto-create inventory** when product is added
- ✅ **Auto-update timestamps** on products and inventory
- ✅ **Auto-calculate subtotals** in sale_items
- ✅ **Triggers for data integrity**

---

## 📈 Useful Queries

### Get Dashboard Metrics
```sql
-- Total products
SELECT COUNT(*) FROM products WHERE is_active = TRUE;

-- Total inventory value
SELECT get_inventory_value();

-- Low stock count
SELECT COUNT(*) FROM low_stock_products;

-- Today's sales
SELECT COUNT(*), SUM(total_amount) 
FROM sales 
WHERE created_at >= CURRENT_DATE;
```

### Get Recent Activity
```sql
-- Recent stock movements
SELECT * FROM stock_movements 
ORDER BY created_at DESC 
LIMIT 10;

-- Recent sales
SELECT * FROM sales_with_details 
ORDER BY created_at DESC 
LIMIT 10;
```

### Get Product Details
```sql
-- Product with full details
SELECT * FROM products_with_inventory 
WHERE sku = 'ABC123';

-- Product stock history
SELECT * FROM stock_movements 
WHERE product_id = 'product-uuid' 
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: RLS blocking queries
**Solution:** Ensure user is authenticated and policies are correct
```sql
-- Check current user
SELECT auth.uid();

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### Issue: Trigger not firing
**Solution:** Check trigger exists and is enabled
```sql
-- List all triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### Issue: Slow queries
**Solution:** Check indexes and use EXPLAIN ANALYZE
```sql
-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM products_with_inventory;

-- Check missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE schemaname = 'public';
```

---

## 📝 Migration Checklist

When applying schema changes:

- [ ] Backup database first
- [ ] Test migration on development database
- [ ] Review migration SQL for errors
- [ ] Apply migration during low-traffic period
- [ ] Verify migration with verification queries
- [ ] Test application functionality
- [ ] Monitor for errors
- [ ] Document changes

---

## 🔄 Schema Versioning

| Version | Date | Changes | Migration File |
|---------|------|---------|----------------|
| 1.0 | 2026-04-15 | Initial schema | schema-complete.sql |
| 1.1 | 2026-04-15 | Add import types | add_import_type_to_stock_movements.sql |
| 2.0 | TBD | Add import_history | create_import_history_table.sql |

---

## 📚 Additional Documentation

- **Supabase Conventions:** `../.kiro/steering/supabase-conventions.md`
- **Security Standards:** `../.kiro/steering/security-standards.md`
- **API Standards:** `../.kiro/steering/api-standards.md`

---

## 🤝 Contributing

When making schema changes:

1. Create a new migration file in `migrations/`
2. Update `schema-complete.sql` with the changes
3. Update `SCHEMA_REFERENCE.md` documentation
4. Update version number in this README
5. Test thoroughly before committing

---

## 📞 Support

For questions or issues:
- Check `SCHEMA_REFERENCE.md` for detailed documentation
- Review `schema-complete.sql` for complete schema
- Consult Supabase documentation: https://supabase.com/docs

---

**Happy Coding! 🚀**

