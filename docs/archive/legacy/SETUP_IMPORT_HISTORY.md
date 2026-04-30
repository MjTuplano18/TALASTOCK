# Setup Import History Feature

**You're seeing a 500 error because the database tables haven't been created yet.**

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Sign in to your account
3. Select your Talastock project

### Step 2: Run the Migration
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file: `database/migrations/create_import_history_tables.sql`
4. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
5. **Paste into Supabase SQL Editor** (Ctrl+V)
6. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Tables Created
After running the migration, verify the tables exist:

```sql
-- Run this query to check
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('import_history', 'import_data_snapshot', 'import_templates');
```

You should see 3 tables:
- ✅ import_history
- ✅ import_data_snapshot
- ✅ import_templates

### Step 4: Refresh Your App
1. Go back to your Talastock app
2. Navigate to `/imports` page
3. Refresh the page (F5)
4. The error should be gone!

---

## What the Migration Creates

### Tables
1. **import_history** - Tracks all import operations
2. **import_data_snapshot** - Stores data for rollback
3. **import_templates** - Saves column mapping templates

### Functions
1. **calculate_import_quality_score()** - Calculates quality score
2. **get_import_statistics()** - Returns aggregated stats

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only see their own imports
- Policies for SELECT, INSERT, UPDATE, DELETE

---

## Troubleshooting

### Error: "relation does not exist"
**Solution:** Run the migration SQL in Supabase

### Error: "permission denied"
**Solution:** Make sure you're using the Supabase service role key in backend

### Error: "function does not exist"
**Solution:** Re-run the entire migration SQL

### Still getting 500 error?
1. Check backend console for detailed error
2. Verify Supabase connection in backend/.env
3. Make sure backend is running (uvicorn main:app --reload)

---

## After Setup

Once the migration is complete, you can:

✅ View import history at `/imports`  
✅ See statistics dashboard  
✅ Filter imports by type, status, date  
✅ View detailed errors and warnings  
✅ Rollback imports if needed  
✅ Track quality scores  

---

## Need Help?

If you're still having issues:
1. Check the backend console for error details
2. Verify the migration ran successfully
3. Check Supabase logs in the dashboard
4. Make sure your backend .env has correct Supabase credentials

---

**Ready?** Go run that migration! 🚀
