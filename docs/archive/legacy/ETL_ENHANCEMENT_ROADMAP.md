# Talastock ETL Enhancement Roadmap

**Current Status:** Basic ETL implemented (Excel/CSV import with validation)  
**Goal:** Transform into production-grade data pipeline system  
**Timeline:** 3-6 weeks for core enhancements

---

## 🎯 Current ETL Capabilities

### ✅ What We Have
- **Extract:** Read Excel (.xlsx, .xls) and CSV files
- **Transform:** 
  - Flexible header matching (handles variations like "Product Name" vs "Item")
  - Data validation (required fields, data types, ranges)
  - Date/time parsing (handles Excel serial numbers and string formats)
  - Number parsing (removes currency symbols, handles decimals)
  - Calculated fields (auto-calculate totals)
- **Load:** Insert validated data into PostgreSQL with error reporting
- **Entities:** Products, Inventory, Sales

### 📊 Import Features
- Preview before import
- Validation error reporting
- Row-level error tracking
- Warning system for data anomalies
- Template download for correct format

---

## 🚀 Recommended Enhancements

### Priority 1: Quick Wins (1-2 days each)

#### 1. Data Quality Dashboard ⭐⭐⭐
**Impact:** HIGH | **Effort:** LOW | **Time:** 2 days

**What to Build:**
- Import history page showing all past imports
- Success/failure metrics and trends
- Data quality scores per import
- Rollback capability for bad imports
- Audit trail (who imported what, when)

**Features:**
```
Import History Table:
- Date/Time
- User
- File Name
- Entity Type (Products/Sales/Inventory)
- Status (Success/Failed/Partial)
- Records Processed
- Errors Count
- Actions (View Details, Rollback)

Metrics Dashboard:
- Total imports this month
- Success rate (%)
- Most common errors
- Average processing time
- Data quality score trend
```

**Database Schema:**
```sql
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'products', 'sales', 'inventory'
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  total_rows INT NOT NULL,
  successful_rows INT NOT NULL,
  failed_rows INT NOT NULL,
  errors JSONB, -- Array of error objects
  warnings JSONB, -- Array of warning objects
  processing_time_ms INT,
  can_rollback BOOLEAN DEFAULT true,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE import_data_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES import_history(id),
  entity_id UUID NOT NULL, -- ID of created/updated record
  entity_type TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'insert', 'update'
  old_data JSONB, -- For rollback
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Components:**
- `/imports` - Import history page
- Import details modal with error breakdown
- Rollback confirmation dialog
- Data quality metrics cards

**Value Proposition:**
- Shows data governance maturity
- Enables debugging and troubleshooting
- Provides accountability and audit trail
- Demonstrates production-ready ETL

---

#### 2. Smart Column Mapping UI ⭐⭐
**Impact:** MEDIUM | **Effort:** LOW | **Time:** 2 days

**What to Build:**
- Visual column mapping interface
- Save mapping templates for recurring imports
- Auto-detect column mappings using AI/heuristics
- Preview mapped data before import

**Features:**
```
Column Mapping Interface:
┌─────────────────────────────────────┐
│ File Column    →    System Field    │
├─────────────────────────────────────┤
│ Item Name      →    Product Name    │
│ Code           →    SKU             │
│ Price (₱)      →    Unit Price      │
│ Stock          →    Quantity        │
│ [Ignore]       →    [Not Mapped]    │
└─────────────────────────────────────┘

Save as Template: [Supplier A Format] [Save]
Load Template: [Select...] ▼
```

**Database Schema:**
```sql
CREATE TABLE import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  column_mappings JSONB NOT NULL,
  -- Example: {"Item Name": "product_name", "Code": "sku"}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Value Proposition:**
- Handles multiple supplier formats
- Reduces user errors
- Saves time on recurring imports
- Shows advanced transformation logic

---

#### 3. Enhanced Error Handling & Recovery ⭐⭐
**Impact:** MEDIUM | **Effort:** LOW | **Time:** 1 day

**What to Build:**
- Partial import mode (skip errors, import valid rows)
- Dry run mode (preview without saving)
- Export error report as CSV
- Retry failed rows after fixing

**Features:**
```
Import Options:
☐ Dry Run (preview only, don't save)
☑ Partial Import (skip errors, import valid rows)
☐ Stop on First Error
☐ Update Existing Records (match by SKU)

After Import:
- 45 rows imported successfully
- 5 rows failed (download error report)
- [Retry Failed Rows] button
```

**Value Proposition:**
- More flexible import process
- Reduces frustration with large files
- Shows robust error handling

---

### Priority 2: Medium Effort (3-5 days each)

#### 4. Scheduled ETL Jobs ⭐⭐⭐
**Impact:** HIGH | **Effort:** MEDIUM | **Time:** 4 days

**What to Build:**
- Automated daily/weekly imports from configured sources
- Job scheduler with cron-like syntax
- Email notifications on success/failure
- Retry logic with exponential backoff

**Features:**
```
Scheduled Jobs:
┌────────────────────────────────────────────────┐
│ Job Name: Daily Supplier Price Update         │
│ Schedule: Every day at 6:00 AM                │
│ Source: FTP server (supplier.com/prices.xlsx) │
│ Entity: Products                               │
│ Template: Supplier A Format                   │
│ Notify: admin@talastock.com                   │
│ Status: ✓ Last run: 2026-04-28 06:00 (45 rows)│
│ [Edit] [Run Now] [Disable]                    │
└────────────────────────────────────────────────┘
```

**Tech Stack Options:**
1. **Simple:** Python APScheduler + background thread
2. **Robust:** Celery + Redis
3. **Serverless:** Supabase Edge Functions + pg_cron

**Database Schema:**
```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  schedule_cron TEXT NOT NULL, -- '0 6 * * *' = daily at 6am
  source_type TEXT NOT NULL, -- 'ftp', 'url', 'api', 'local'
  source_config JSONB NOT NULL,
  template_id UUID REFERENCES import_templates(id),
  notify_emails TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id),
  import_id UUID REFERENCES import_history(id),
  status TEXT NOT NULL, -- 'success', 'failed', 'running'
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Value Proposition:**
- Transforms from manual to automated ETL
- Shows production pipeline orchestration
- Demonstrates scheduling and job management
- Real-world business value (saves time)

---

#### 5. Multi-Source Data Reconciliation ⭐⭐⭐
**Impact:** HIGH | **Effort:** MEDIUM | **Time:** 4 days

**What to Build:**
- Bank deposits vs POS sales reconciliation
- Physical inventory count vs system records
- Supplier invoices vs purchase orders
- Discrepancy detection and reporting

**Features:**
```
Reconciliation Dashboard:
┌─────────────────────────────────────────────┐
│ Bank vs POS (April 2026)                   │
│ Bank Deposits:     ₱125,450.00             │
│ POS Sales:         ₱123,200.00             │
│ Discrepancy:       ₱2,250.00 ⚠️            │
│ [View Details] [Mark as Resolved]          │
└─────────────────────────────────────────────┘

Discrepancy Details:
- April 15: Missing ₱500 (no POS record)
- April 22: Extra ₱1,750 (cash not deposited?)
```

**Database Schema:**
```sql
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'bank_pos', 'inventory_count', 'invoice_po'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  source_a_total NUMERIC(10,2),
  source_b_total NUMERIC(10,2),
  discrepancy NUMERIC(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'resolved'
  notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID REFERENCES reconciliations(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  source_a_amount NUMERIC(10,2),
  source_b_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  matched BOOLEAN DEFAULT false,
  notes TEXT
);
```

**Value Proposition:**
- Solves real Filipino SME problem (cash shortages, theft)
- Shows complex business logic
- Demonstrates data integrity focus
- High business impact

---

#### 6. Data Warehouse / Analytics Layer ⭐⭐⭐
**Impact:** HIGH | **Effort:** MEDIUM | **Time:** 5 days

**What to Build:**
- Pre-aggregated tables for fast reporting
- Daily/weekly/monthly rollup tables
- Materialized views for complex queries
- Automated refresh jobs

**Features:**
```
Analytics Tables:
- daily_sales_summary (fast dashboard loading)
- monthly_inventory_snapshot (trend analysis)
- product_performance_metrics (top products)
- customer_lifetime_value (credit customers)
```

**Database Schema:**
```sql
-- Daily sales aggregates
CREATE TABLE daily_sales_summary (
  date DATE PRIMARY KEY,
  total_revenue NUMERIC(10,2) NOT NULL,
  total_transactions INT NOT NULL,
  total_items_sold INT NOT NULL,
  avg_order_value NUMERIC(10,2),
  top_product_id UUID,
  top_product_revenue NUMERIC(10,2),
  cash_sales NUMERIC(10,2),
  credit_sales NUMERIC(10,2),
  refunded_amount NUMERIC(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly inventory snapshots
CREATE TABLE monthly_inventory_snapshot (
  month DATE NOT NULL,
  product_id UUID NOT NULL,
  avg_quantity NUMERIC(10,2),
  min_quantity INT,
  max_quantity INT,
  total_restocked INT,
  total_sold INT,
  stockout_days INT, -- Days with zero stock
  PRIMARY KEY (month, product_id)
);

-- Product performance metrics
CREATE TABLE product_performance_metrics (
  product_id UUID PRIMARY KEY,
  total_revenue_30d NUMERIC(10,2),
  total_sold_30d INT,
  avg_daily_sales NUMERIC(10,2),
  revenue_trend TEXT, -- 'up', 'down', 'stable'
  last_sale_date DATE,
  days_since_last_sale INT,
  is_dead_stock BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh job
CREATE OR REPLACE FUNCTION refresh_daily_sales_summary()
RETURNS void AS $$
BEGIN
  INSERT INTO daily_sales_summary (date, total_revenue, total_transactions, ...)
  SELECT 
    DATE(created_at) as date,
    SUM(total_amount) as total_revenue,
    COUNT(*) as total_transactions,
    ...
  FROM sales
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(created_at)
  ON CONFLICT (date) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    ...
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

**Value Proposition:**
- Shows understanding of OLTP vs OLAP
- Demonstrates data warehousing concepts
- Improves dashboard performance
- Enables advanced analytics

---

### Priority 3: Advanced (1 week each)

#### 7. External API Integrations ⭐⭐⭐
**Impact:** HIGH | **Effort:** HIGH | **Time:** 7 days

**What to Build:**
- Import products from supplier APIs
- Sync prices from competitor websites (web scraping)
- Import bank transactions from GCash/PayMaya APIs
- Pull exchange rates for multi-currency

**Example Integrations:**
```
1. Supplier API Integration
   - Fetch product catalog daily
   - Update prices automatically
   - Sync stock availability

2. GCash Business API
   - Import transactions
   - Match to sales records
   - Auto-reconcile

3. Web Scraping (Competitor Prices)
   - Monitor competitor pricing
   - Alert on price changes
   - Suggest price adjustments

4. Exchange Rate API
   - Daily USD/PHP rates
   - Auto-convert prices
   - Multi-currency support
```

**Database Schema:**
```sql
CREATE TABLE external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'api', 'scraper', 'ftp'
  config JSONB NOT NULL,
  -- Example: {"url": "...", "api_key": "...", "auth_type": "bearer"}
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE external_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES external_sources(id),
  records_fetched INT,
  records_imported INT,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Value Proposition:**
- Shows API integration skills
- Demonstrates real-world data sourcing
- Enables competitive intelligence
- High business value

---

#### 8. Real-time Data Streaming ⭐⭐
**Impact:** MEDIUM | **Effort:** HIGH | **Time:** 7 days

**What to Build:**
- Real-time inventory updates from POS to warehouse
- Live sales dashboard (updates every second)
- WebSocket connections for live data
- Event-driven architecture

**Tech Stack:**
- Supabase Realtime (already available!)
- Or: Server-Sent Events (SSE)
- Or: WebSockets

**Features:**
```
Live Dashboard:
- Sales counter updates in real-time
- Inventory levels update on every sale
- Low stock alerts appear instantly
- Multiple users see same live data
```

**Value Proposition:**
- Shows modern data architecture
- Demonstrates real-time processing
- Improves user experience
- Differentiates from batch-only systems

---

#### 9. Data Lineage & Impact Analysis ⭐⭐
**Impact:** MEDIUM | **Effort:** HIGH | **Time:** 7 days

**What to Build:**
- Visual data lineage graph
- Track data origin and transformations
- Impact analysis before deleting data
- Dependency mapping

**Features:**
```
Data Lineage View:
Product "Sugar 1kg"
  ← Imported from: supplier_prices.xlsx (2026-04-15)
  ← Updated by: admin@talastock.com (2026-04-20)
  → Used in: 45 sales transactions
  → Referenced in: 3 credit sales
  → Affects: inventory, revenue reports

Impact Analysis:
"Deleting this product will affect:
 - 45 historical sales records
 - 3 customer credit accounts
 - 12 stock movement records
 Recommendation: Deactivate instead of delete"
```

**Value Proposition:**
- Shows enterprise-level data governance
- Demonstrates data relationship understanding
- Prevents data integrity issues
- Impressive for portfolio

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Build monitoring and quality infrastructure

- ✅ Day 1-2: Data Quality Dashboard
- ✅ Day 3-4: Smart Column Mapping UI
- ✅ Day 5-6: Enhanced Error Handling
- ✅ Day 7-10: Testing and polish

**Deliverables:**
- Import history page
- Column mapping interface
- Rollback capability
- Error export functionality

---

### Phase 2: Automation (Week 3-4)
**Goal:** Transform to automated pipeline

- ✅ Day 11-14: Scheduled ETL Jobs
- ✅ Day 15-18: Multi-Source Reconciliation
- ✅ Day 19-20: Testing and documentation

**Deliverables:**
- Job scheduler
- Automated imports
- Reconciliation dashboard
- Email notifications

---

### Phase 3: Advanced Analytics (Week 5-6)
**Goal:** Add data warehouse layer

- ✅ Day 21-25: Data Warehouse / Analytics Layer
- ✅ Day 26-30: Performance optimization
- ✅ Day 31-35: External API Integrations (optional)

**Deliverables:**
- Aggregated tables
- Fast reporting queries
- API integrations (if time permits)

---

## 🎯 Success Metrics

### Technical Metrics
- Import success rate > 95%
- Average import time < 5 seconds for 1000 rows
- Data quality score > 90%
- Zero data loss incidents
- Rollback success rate 100%

### Business Metrics
- Time saved on manual data entry: 10+ hours/week
- Reduction in data errors: 80%
- Faster reporting: 5x improvement
- User satisfaction: 4.5/5 stars

---

## 💼 Resume Impact

### Before
"Built ETL for importing Excel files"

### After
"Designed and implemented production-grade ETL pipeline with:
- Automated job scheduling and orchestration
- Data quality monitoring and governance
- Multi-source reconciliation and anomaly detection
- Real-time data streaming and analytics
- External API integrations
- Comprehensive audit trails and rollback capabilities"

### Keywords Added
- Data pipeline orchestration
- Data quality monitoring
- Automated data reconciliation
- Data lineage tracking
- Batch and real-time processing
- Data governance
- ETL error handling and retry logic
- Data warehouse design
- API integration
- Web scraping
- Job scheduling
- Event-driven architecture

---

## 🚀 Quick Start

### Recommended First Steps

1. **This Weekend:** Data Quality Dashboard (2 days)
   - Most visible improvement
   - Easy to implement
   - High impact

2. **Next Week:** Scheduled ETL Jobs (4 days)
   - Shows automation skills
   - Real business value
   - Production-ready feature

3. **Week After:** Multi-Source Reconciliation (4 days)
   - Solves real problem
   - Complex business logic
   - Impressive for thesis

**Total: 10 days = Significantly enhanced ETL system**

---

## 📚 Learning Resources

### ETL Best Practices
- "The Data Warehouse Toolkit" by Ralph Kimball
- "Designing Data-Intensive Applications" by Martin Kleppmann
- Apache Airflow documentation (for job orchestration concepts)

### Tools to Explore
- **Job Scheduling:** Celery, APScheduler, pg_cron
- **Data Quality:** Great Expectations, dbt
- **Data Lineage:** Apache Atlas, OpenLineage
- **Monitoring:** Grafana, Prometheus

---

## 🎓 Thesis/Portfolio Value

### Why These Enhancements Matter

1. **Shows Production Readiness**
   - Not just a prototype
   - Handles real-world complexity
   - Enterprise-grade features

2. **Demonstrates Technical Depth**
   - Data governance
   - System design
   - Performance optimization
   - Error handling

3. **Solves Real Problems**
   - Cash reconciliation (Filipino SME pain point)
   - Automated data entry (saves time)
   - Data quality (prevents errors)

4. **Differentiates Your Project**
   - Most student projects: basic CRUD
   - Your project: production ETL pipeline
   - Competitive advantage in job market

---

**Ready to start?** Pick one feature and let's build it! 🚀

**Questions?** Review this document and choose your priority based on:
- Time available
- Thesis requirements
- Personal interest
- Career goals

---

**Last Updated:** April 28, 2026  
**Status:** Planning Phase  
**Next Action:** Choose Phase 1 feature to implement
