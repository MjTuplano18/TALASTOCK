# Database Migrations

## How to Run Migrations

### Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and run the SQL

### Migration Files

- `create_settings_table.sql` - Creates the settings table for storing app-wide configuration like monthly revenue goal

## Settings Table

The settings table stores key-value pairs for app configuration:

- `monthly_revenue_goal` - The monthly revenue target (default: 50000)

### Example: Update Monthly Revenue Goal

```sql
UPDATE settings 
SET value = '100000', updated_at = NOW()
WHERE key = 'monthly_revenue_goal';
```

### Example: Query Current Goal

```sql
SELECT * FROM settings WHERE key = 'monthly_revenue_goal';
```
