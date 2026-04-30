# Database Migrations

This directory contains SQL migration files for the Talastock database schema.

## Migration Files

### Core Schema
- `create_customer_credit_management_schema.sql` - Main credit management schema
- `create_settings_table.sql` - Application settings table
- `create_decrement_inventory_function.sql` - Inventory decrement function

### Credit System
- `add_credit_limit_tracking_columns.sql` - Add credit limit tracking
- `add_credit_payment_method_to_sales.sql` - Add credit payment method
- `update_customer_credit_limits.sql` - Update customer credit limits
- `verify_and_update_credit_rls_policies.sql` - Update RLS policies

### Sales & Inventory
- `add_pre_launch_fields_to_sales.sql` - Add pre-launch fields
- `add_import_type_to_stock_movements.sql` - Add import type tracking
- `fix_sales_delete_policy.sql` - Fix sales deletion policy

## Running Migrations

### Via Supabase Dashboard (Recommended)
1. Go to SQL Editor in Supabase Dashboard
2. Copy migration file content
3. Review the SQL carefully
4. Click "Run"

### Via Supabase CLI
```bash
supabase db push --file database/migrations/filename.sql
```

### Via psql
```bash
psql -h your-host -U your-user -d your-database -f database/migrations/filename.sql
```

## Migration Order

For a fresh database, run migrations in this order:

1. `create_settings_table.sql`
2. `create_customer_credit_management_schema.sql`
3. `create_decrement_inventory_function.sql`
4. `add_credit_payment_method_to_sales.sql`
5. `add_credit_limit_tracking_columns.sql`
6. `add_pre_launch_fields_to_sales.sql`
7. `add_import_type_to_stock_movements.sql`
8. `update_customer_credit_limits.sql`
9. `verify_and_update_credit_rls_policies.sql`
10. `fix_sales_delete_policy.sql`

## Documentation

Detailed documentation has been moved to `/docs/credit-management/`:
- Credit system overview
- Credit sales flow explanation
- Quick start guide
- API summaries
- Task completion summaries

## Safety Guidelines

⚠️ **Before running any migration:**
- Backup your database
- Test in development environment first
- Review the SQL statements
- Check for potential data loss
- Verify table and column names

## Settings Table

The settings table stores app-wide configuration:

```sql
-- View current settings
SELECT * FROM settings;

-- Update monthly revenue goal
UPDATE settings 
SET value = '100000', updated_at = NOW()
WHERE key = 'monthly_revenue_goal';
```

## Rollback

If a migration fails:
1. Restore from backup
2. Check error logs in Supabase
3. Fix the issue
4. Re-run the migration

## Need Help?

- Check `/docs/guides/SUPABASE_SQL_INSTRUCTIONS.md`
- Review `/docs/credit-management/` for credit system docs
- Check `/database/scripts/` for utility scripts
- Review Supabase logs for errors
