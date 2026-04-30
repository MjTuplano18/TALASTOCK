# Database Scripts

This directory contains SQL scripts and database-related utilities.

## Script Categories

### Migration Scripts
- `PRODUCTION_MIGRATION_CLEAN.sql` - Clean production migration
- `SIMPLE_PRODUCTION_MIGRATION.sql` - Simplified migration script
- `VERIFY_MIGRATION.sql` - Verify migration success

### Fix Scripts
- `FIX_DUPLICATE_TRIGGER_ERROR.sql` - Fix duplicate trigger issues
- `FIX_DUPLICATE_TRIGGERS_NOW.sql` - Immediate trigger fix
- `FIX_REFUND_RLS_POLICY.sql` - Fix refund RLS policies
- `QUICK_FIX_REFUND_STATUS.sql` - Quick refund status fix

### Cleanup Scripts
- `NUCLEAR_CLEANUP_PRODUCTION.sql` - Complete production cleanup (USE WITH CAUTION!)

### Test Scripts
- `TEST_REFUND_STATUS.sql` - Test refund status functionality
- `test-backend.sh` - Backend testing script

## Usage Guidelines

### Before Running Any Script

1. **Backup your database first!**
   ```sql
   -- Create a backup
   pg_dump your_database > backup_$(date +%Y%m%d).sql
   ```

2. **Test in development environment first**
   - Never run untested scripts in production
   - Verify the script logic
   - Check for potential data loss

3. **Review the script contents**
   - Understand what each statement does
   - Check for DROP, DELETE, or TRUNCATE statements
   - Verify table and column names match your schema

### Running Scripts

#### Via Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the script content
3. Review the SQL
4. Click "Run"

#### Via psql
```bash
psql -h your-host -U your-user -d your-database -f script-name.sql
```

#### Via Supabase CLI
```bash
supabase db push --file script-name.sql
```

## Script Descriptions

### PRODUCTION_MIGRATION_CLEAN.sql
Clean migration script for production database. Includes:
- Credit management schema
- Customer tables
- Payment tracking
- RLS policies

### NUCLEAR_CLEANUP_PRODUCTION.sql
⚠️ **DANGER: This script drops tables and data!**
Only use when you need to completely reset the credit management system.

### FIX_DUPLICATE_TRIGGERS_NOW.sql
Fixes issues with duplicate triggers on sales table that were causing errors during sales creation.

### FIX_REFUND_RLS_POLICY.sql
Updates Row Level Security policies for refund operations to ensure proper access control.

## Safety Checklist

Before running any script in production:
- [ ] Database backup created
- [ ] Script tested in development
- [ ] Script reviewed and understood
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback plan prepared
- [ ] Team notified
- [ ] Monitoring in place

## Rollback Procedures

If a script causes issues:

1. **Stop immediately** - Don't run additional statements
2. **Restore from backup** if data was lost
3. **Check application logs** for errors
4. **Verify data integrity** after rollback
5. **Document what went wrong**

## Common Issues

### Permission Denied
```sql
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

### Syntax Errors
- Check PostgreSQL version compatibility
- Verify Supabase-specific syntax
- Look for missing semicolons

### Constraint Violations
- Check foreign key relationships
- Verify unique constraints
- Review check constraints

## Getting Help

If you encounter issues:
1. Check the error message carefully
2. Review the script documentation
3. Check Supabase logs
4. Consult the main documentation in `/docs`
5. Ask the team for help

## Maintenance

- Review and clean up old scripts quarterly
- Archive scripts that are no longer needed
- Update this README when adding new scripts
- Document any manual steps required
