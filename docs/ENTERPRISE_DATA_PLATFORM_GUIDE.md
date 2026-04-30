# Enterprise Data Platform Guide for Talastock

> **A Complete Guide to Transforming Talastock into an Enterprise-Level Data Platform**
> 
> This document explains the business value, technical architecture, and implementation strategy for upgrading Talastock from a basic inventory system into a modern data platform.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [Real User Benefits](#real-user-benefits)
4. [Technical Architecture Overview](#technical-architecture-overview)
5. [What You're Building](#what-youre-building)
6. [UI Strategy](#ui-strategy)
7. [Implementation Phases](#implementation-phases)
8. [Portfolio Impact](#portfolio-impact)
9. [Learning Roadmap](#learning-roadmap)

---

## Executive Summary

### What Is This Project?

Transforming Talastock from a basic inventory management app into an **enterprise-level data platform** that demonstrates modern data engineering practices.

### Why Does It Matter?

**For Users (Filipino SMEs):**
- Increase profit by ₱30,000+/month through data-driven decisions
- Predict demand and prevent stockouts
- Optimize inventory and reduce waste
- Get business loans with professional reports

**For You (Portfolio):**
- Transform from "app developer" → "data engineer"
- Demonstrate modern data stack (Airflow, dbt, BigQuery)
- Show real business impact with measurable results
- Stand out in job applications

### Key Technologies

- **Apache Airflow**: ETL orchestration
- **dbt (Data Build Tool)**: SQL transformations
- **BigQuery/Snowflake**: Data warehouse
- **Python**: Data generation, ML forecasting
- **Next.js**: Analytics dashboard

---

## The Problem We're Solving

### Current State: Basic Inventory System

**What Talastock Does Now:**
- ✅ Product CRUD operations
- ✅ Inventory tracking
- ✅ Sales recording
- ✅ Simple dashboard
- ✅ Import/export functionality

**What's Missing:**
- ❌ Historical trend analysis (only shows recent data)
- ❌ Demand forecasting (can't predict future)
- ❌ Profit optimization (doesn't show which products make money)
- ❌ Data quality monitoring (errors go unnoticed)
- ❌ Scalable analytics (queries slow down as data grows)

### Target State: Enterprise Data Platform

**What We're Adding:**
- ✅ 12+ months of historical data
- ✅ ML-powered sales forecasting
- ✅ Profit analysis by product/category
- ✅ Automated data quality checks
- ✅ Separate analytics database (fast queries)
- ✅ Scheduled data pipelines
- ✅ Professional business reports

---

## Real User Benefits

### User Profile: Maria's Sari-Sari Store

Maria runs a small sari-sari store in Manila. Here's how the data platform helps her:

### 💰 Benefit 1: Never Run Out of Stock

**Problem:**
- Maria constantly runs out of Lucky Me Pancit Canton
- Customers go to competitors
- Loses ₱500+ per stockout

**Solution: Sales Forecasting**
```
📊 Forecast Alert (Monday 6 AM)

Lucky Me Pancit Canton:
├── Current stock: 15 packs
├── Predicted sales this week: 45 packs
└── ⚠️ You'll run out by Wednesday!

💡 Recommendation: Order 50 packs today
```

**Impact:**
- ✅ Never runs out of best-sellers
- ✅ Saves ₱8,000/month in lost sales
- ✅ Orders exactly what she needs

---

### 📈 Benefit 2: Focus on Profitable Products

**Problem:**
- Maria doesn't know which products make money
- Stocks items that barely profit
- Wastes shelf space on slow movers

**Solution: Profit Analysis Dashboard**
```
📊 Profit Analysis (Last 30 Days)

Top Profit Makers:
1. Lucky Me (₱3,500 profit, 25% margin) ⭐
2. Nescafé 3-in-1 (₱2,800 profit, 30% margin) ⭐
3. Coke 1.5L (₱1,200 profit, 15% margin)

Money Losers:
❌ Chips (₱200 profit, 5% margin) - Taking up space!
❌ Candy (₱150 profit, 8% margin) - Slow moving

💡 Recommendation: Stock more Lucky Me and Nescafé
```

**Impact:**
- ✅ Focuses on high-profit products
- ✅ Stops wasting money on low-margin items
- ✅ Increases monthly profit by ₱5,000+

---

### 🗓️ Benefit 3: Prepared for Payday Rush

**Problem:**
- Every 15th and 30th (payday), store gets flooded
- Runs out of popular items
- Stressed and losing money

**Solution: Payday Pattern Analysis**
```
📊 Payday Pattern Analysis

Your store sells 2.5x more on payday dates!

Next Payday: May 15 (5 days away)

Predicted High Demand:
├── Lucky Me: 120 packs (vs usual 45)
├── Coke: 80 bottles (vs usual 30)
└── Nescafé: 60 sachets (vs usual 25)

💡 Order NOW to be ready!
```

**Impact:**
- ✅ Prepared for payday rush
- ✅ Captures ₱16,000 extra sales per month
- ✅ Less stress, more profit

---

### 🕐 Benefit 4: Optimize Working Hours

**Problem:**
- Maria opens 6 AM - 10 PM (16 hours!)
- Exhausted every day
- Doesn't know when customers actually come

**Solution: Time-of-Day Analysis**
```
📊 Sales by Hour (Last 90 Days)

Peak Hours (70% of sales):
├── 7-9 AM: ₱12,000/week (breakfast rush)
├── 5-7 PM: ₱18,000/week (dinner rush)
└── 8-10 PM: ₱5,000/week (evening snacks)

Slow Hours (10% of sales):
├── 10 AM - 3 PM: ₱2,000/week
└── 3-5 PM: ₱1,500/week

💡 Suggestion: Close 10 AM - 4 PM, save 6 hours daily!
```

**Impact:**
- ✅ Works 10 hours instead of 16
- ✅ Only loses ₱3,500/week in slow-hour sales
- ✅ Saves ₱10,000/month in electricity
- ✅ Better work-life balance!

---

### 📦 Benefit 5: Catch Supplier Price Increases

**Problem:**
- Suppliers increase prices without notice
- Maria can't remember historical prices
- Accepts unfair price increases

**Solution: Historical Price Tracking**
```
📊 Price History: Coke 1.5L

Current supplier quote: ₱35/bottle

Your purchase history:
├── Jan 2024: ₱32/bottle
├── Feb 2024: ₱32/bottle
├── Mar 2024: ₱33/bottle
└── Apr 2024: ₱33/bottle

⚠️ Alert: Price increased 6% in one month!
Average market price: ₱33/bottle

💡 Negotiate or find new supplier!
```

**Impact:**
- ✅ Catches price increases immediately
- ✅ Negotiates better with suppliers
- ✅ Saves ₱2,000/month on purchases

---

### 🎯 Benefit 6: Get Business Loans

**Problem:**
- Maria wants to expand (open second store)
- Bank asks for financial reports
- Maria only has receipts
- Loan denied

**Solution: Professional Business Reports**
```
📊 Business Performance Report (Auto-generated)

Revenue Trend (12 months):
├── Growing 8% month-over-month
├── ₱45,000/month → ₱98,000/month
└── Projected: ₱120,000/month in 6 months

Profit Margin: 22% (industry avg: 18%)
Inventory Turnover: 12x/year (healthy)
Customer Growth: +15% quarterly

Data Quality: 98% (reliable data)

💡 Strong business case for expansion
```

**Impact:**
- ✅ Gets bank loan approved
- ✅ Opens second store location
- ✅ Professional business image
- ✅ Makes data-driven decisions

---

### 💵 Total Financial Impact

| Feature | Monthly Benefit |
|---------|----------------|
| Sales Forecasting (prevent stockouts) | +₱8,000 |
| Profit Analysis (focus on winners) | +₱5,000 |
| Payday Predictions (capture rush) | +₱16,000 |
| Price Tracking (better deals) | +₱2,000 |
| **Total Extra Profit** | **+₱31,000/month** |

**Plus non-financial benefits:**
- 6 fewer working hours per day
- Less stress and better planning
- Ability to expand business

---

## Technical Architecture Overview

### The Big Picture

```
┌─────────────────────────────────────────────┐
│   EXISTING TALASTOCK APP (OLTP)            │
│   - Products, Inventory, Sales              │
│   - PostgreSQL (Supabase)                   │
│   - Real-time operations                    │
└──────────────┬──────────────────────────────┘
               │
               │ ETL Pipeline (Airflow)
               │ - Extract daily at 2 AM
               │ - Transform & clean
               │ - Load to warehouse
               ↓
┌─────────────────────────────────────────────┐
│   DATA WAREHOUSE (OLAP)                     │
│   - BigQuery or Snowflake                   │
│   - 12+ months historical data              │
│   - Optimized for analytics                 │
└──────────────┬──────────────────────────────┘
               │
               │ dbt Transformations
               │ - Fact tables
               │ - Dimension tables
               │ - Business metrics
               ↓
┌─────────────────────────────────────────────┐
│   ANALYTICS LAYER                           │
│   - Pre-calculated metrics                  │
│   - ML forecasts                            │
│   - Business reports                        │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│   ANALYTICS DASHBOARD (UI)                  │
│   - Forecasts & trends                      │
│   - Profit analysis                         │
│   - Business insights                       │
└─────────────────────────────────────────────┘
```

### OLTP vs OLAP Explained

#### OLTP (Online Transaction Processing)
**Purpose:** Handle day-to-day operations

**Database:** PostgreSQL (Supabase)

**Optimized for:**
- Fast writes (record sale)
- Single-record lookups (find product)
- Real-time operations

**Query Example:**
```sql
INSERT INTO sales (product_id, quantity, total) 
VALUES ('abc-123', 5, 250.00);
```

**Users:** Store staff recording sales

---

#### OLAP (Online Analytical Processing)
**Purpose:** Answer business questions

**Database:** BigQuery or Snowflake

**Optimized for:**
- Complex aggregations
- Scanning millions of rows
- Historical analysis

**Query Example:**
```sql
SELECT 
  product_name,
  SUM(total_amount) as revenue,
  COUNT(*) as transactions
FROM fact_sales
JOIN dim_products USING (product_key)
WHERE date >= '2023-01-01'
GROUP BY product_name
ORDER BY revenue DESC
LIMIT 10;
```

**Users:** Business owners analyzing trends

---

### Why Separate Them?

**Problem with Single Database:**
```
User records sale → PostgreSQL
                      ↓
                   (SLOW!)
                      ↓
Dashboard runs: SUM(revenue) FROM 10M rows
                      ↓
                   (LOCKS TABLE!)
                      ↓
Next user can't record sale (blocked)
```

**Solution with Separate Databases:**
```
User records sale → PostgreSQL (fast, no blocking)

Dashboard queries → BigQuery (separate, pre-aggregated)
```

**Real-World Example:**
- Amazon: Aurora (OLTP) + Redshift (OLAP)
- Netflix: MySQL (OLTP) + Druid (OLAP)
- Uber: PostgreSQL (OLTP) + Hive (OLAP)

---

## What You're Building

### 8 Core Systems

#### 1. Data Generator
**What:** Python script that creates realistic synthetic data

**Why:** Simulate a real Filipino SME with authentic patterns

**Output:**
- 50-100 products (Lucky Me, Nescafé, Coke, etc.)
- 1,000-10,000 sales records
- Realistic patterns (peak hours, payday spikes)
- Messy data (missing values, duplicates)

**Tech Stack:** Python, Faker, Pandas

---

#### 2. Apache Airflow (ETL Orchestration)
**What:** Workflow orchestration platform

**Why:** Schedule and monitor data pipelines professionally

**What It Does:**
- Runs pipelines on schedule (daily at 2 AM)
- Manages task dependencies
- Retries failures automatically
- Provides web UI for monitoring

**Real-World Context:** Created by Airbnb, used by Spotify, Netflix

**Tech Stack:** Apache Airflow 2.x, Python, Docker

---

#### 3. ETL Pipeline
**What:** Extract, Transform, Load process

**Why:** Move data from app DB to warehouse

**Flow:**
```
Source (PostgreSQL)
  ↓ Extract
Raw Layer (unchanged data)
  ↓ Transform (clean, standardize)
Staging Layer (cleaned data)
  ↓ Load
Analytics Layer (business models)
```

**Tech Stack:** Python, Pandas, SQLAlchemy

---

#### 4. Data Warehouse
**What:** Separate database for analytics

**Why:** Don't slow down app with heavy queries

**Architecture:**
- **Raw Layer:** Unprocessed extracted data
- **Staging Layer:** Cleaned and standardized
- **Analytics Layer:** Business-ready models

**Tech Stack:** BigQuery or Snowflake

---

#### 5. dbt (Data Build Tool)
**What:** SQL transformation framework

**Why:** Apply software engineering practices to data

**What It Does:**
- Version control for SQL
- Automated testing
- Documentation generation
- Dependency management

**Project Structure:**
```
dbt/
├── models/
│   ├── staging/
│   │   ├── stg_sales.sql
│   │   └── stg_products.sql
│   └── analytics/
│       ├── fact_sales.sql
│       ├── dim_products.sql
│       └── dim_date.sql
├── tests/
└── docs/
```

**Real-World Context:** Used by GitLab, HubSpot, Shopify

**Tech Stack:** dbt Core, Jinja, SQL

---

#### 6. Star Schema
**What:** Data warehouse design pattern

**Why:** Optimize for business queries

**Structure:**
```
        dim_products          dim_customers
             |                      |
             |                      |
        fact_sales -------- dim_date
             |
             |
        dim_time
```

**Fact Table (fact_sales):**
- Measurable events (transactions)
- Foreign keys to dimensions
- Additive measures (quantity, amount, profit)

**Dimension Tables:**
- Descriptive attributes
- Product details, customer info, date attributes

**Tech Stack:** SQL, dbt

---

#### 7. Analytics Dashboard
**What:** User-facing dashboard powered by warehouse

**Why:** Show business insights to users

**What It Shows:**
- Sales forecasts (ML predictions)
- Historical trends (12+ months)
- Profit analysis by category
- Top products by revenue
- Data freshness indicators

**Tech Stack:** Next.js, BigQuery client, React Query

---

#### 8. Data Quality Monitor
**What:** Automated testing and alerting system

**Why:** Catch data issues before users see them

**What It Checks:**
- Completeness (no missing required fields)
- Uniqueness (no duplicates)
- Validity (values in expected ranges)
- Consistency (relationships valid)
- Freshness (data not stale)

**Tech Stack:** dbt tests, custom SQL checks

---

## UI Strategy

### What Needs UI vs What Doesn't

#### ❌ Don't Build Custom UI For:

**1. Apache Airflow**
- Has built-in web UI (localhost:8080)
- Shows DAG graphs, logs, execution history
- Just screenshot for portfolio

**2. dbt**
- Auto-generates documentation
- Run `dbt docs generate` → beautiful docs site
- Shows data lineage automatically
- Just screenshot for portfolio

**3. BigQuery/Snowflake**
- Has its own console
- Query editor, table browser
- Just screenshot for portfolio

---

#### ✅ Build Minimal UI For:

**1. Analytics Dashboard** (MOST IMPORTANT)
```
New page: /analytics

Components:
├── SalesForecastChart (ML predictions)
├── HistoricalTrendsChart (12 months)
├── TopProductsTable (from warehouse)
├── ProfitAnalysisChart (by category)
└── DataFreshnessBadge ("Updated 2h ago")
```

**Why:** Shows the END RESULT to users and recruiters

**Effort:** 1-2 pages, reuse existing chart components

---

**2. Data Platform Status Card** (Optional)
```
Add to existing /dashboard

Shows:
├── Pipeline Status (✅ Success, 2h ago)
├── Data Quality Score (98% passing)
├── Warehouse Stats (2.5M rows)
└── Recent Alerts (if any)
```

**Why:** Shows you understand observability

**Effort:** 1 simple card component

---

**3. Sync Button** (Optional)
```
Add to /imports page

[Existing Import Button]
[NEW: "Sync to Warehouse" Button]
```

**Why:** Shows integration between app and platform

**Effort:** 1 button + API call

---

### Recommended Approach

**Option A: Minimal (Best for Learning)**
- Build: Analytics Dashboard + Status Card
- Use: Airflow UI, dbt docs, BigQuery console
- Portfolio Impact: 8/10
- Effort: Low

**Option B: Moderate (Best Balance)**
- Build: Analytics Dashboard + Status Page + Sync Button
- Use: Airflow UI, dbt docs, BigQuery console
- Portfolio Impact: 9/10
- Effort: Medium

---

## Implementation Phases

### Phase 1: Data Foundation (Week 1-2)

**Goal:** Generate realistic business data

**Tasks:**
1. Create product catalog (50-100 Filipino products)
2. Generate sales data (1,000-10,000 records)
3. Add realistic patterns (peak hours, payday spikes)
4. Introduce data quality issues (missing values, duplicates)
5. Export to multiple formats (CSV, JSON, Excel)

**Output:** Realistic synthetic dataset

**Learning:** Data generation, business patterns, data quality

---

### Phase 2: ETL Pipeline (Week 3-4)

**Goal:** Build automated data pipeline

**Tasks:**
1. Set up Apache Airflow (Docker)
2. Create extraction scripts (read CSV/Excel)
3. Build transformation logic (clean, standardize)
4. Load to warehouse (BigQuery/Snowflake)
5. Create DAG with dependencies
6. Schedule daily runs

**Output:** Working ETL pipeline

**Learning:** Airflow, ETL patterns, orchestration

---

### Phase 3: Data Warehouse (Week 5-6)

**Goal:** Set up analytics database

**Tasks:**
1. Create BigQuery/Snowflake account
2. Design three-layer architecture (Raw, Staging, Analytics)
3. Create tables in each layer
4. Set up connection from Airflow
5. Test data loading

**Output:** Functioning data warehouse

**Learning:** OLTP vs OLAP, warehouse architecture

---

### Phase 4: dbt Transformations (Week 7-8)

**Goal:** Transform data into business models

**Tasks:**
1. Set up dbt project
2. Create staging models (cleaned data)
3. Create fact table (fact_sales)
4. Create dimension tables (dim_products, dim_date, dim_time)
5. Add data quality tests
6. Generate documentation

**Output:** Star schema with tested models

**Learning:** dbt, star schema, data modeling

---

### Phase 5: Analytics Layer (Week 9-10)

**Goal:** Create business metrics

**Tasks:**
1. Create daily_sales_summary table
2. Create product_performance table
3. Create customer_metrics table
4. Create profit_analysis table
5. Set up refresh schedules

**Output:** Pre-calculated business metrics

**Learning:** Metric design, aggregations

---

### Phase 6: ML Forecasting (Week 11-12)

**Goal:** Add sales predictions

**Tasks:**
1. Extract historical sales data
2. Feature engineering (day_of_week, is_payday, etc.)
3. Train Prophet/ARIMA model
4. Generate 30-day forecasts
5. Store predictions in warehouse
6. Schedule weekly retraining

**Output:** Working forecasting system

**Learning:** Time-series ML, Prophet/ARIMA

---

### Phase 7: Analytics Dashboard (Week 13-14)

**Goal:** Build user-facing UI

**Tasks:**
1. Create /analytics page
2. Add forecast chart component
3. Add historical trends chart
4. Add top products table
5. Add profit analysis chart
6. Connect to BigQuery
7. Add data freshness indicator

**Output:** Analytics dashboard

**Learning:** BigQuery client, React Query

---

### Phase 8: Data Quality & Monitoring (Week 15-16)

**Goal:** Add observability

**Tasks:**
1. Implement dbt tests
2. Create data quality log tables
3. Add freshness checks
4. Add volume anomaly detection
5. Set up alerts (email/Slack)
6. Create data health dashboard

**Output:** Monitoring system

**Learning:** Data quality, observability

---

### Phase 9: Documentation (Week 17-18)

**Goal:** Professional portfolio documentation

**Tasks:**
1. Create architecture diagrams
2. Document data flows
3. Explain tech stack decisions
4. Screenshot Airflow UI
5. Screenshot dbt docs
6. Screenshot analytics dashboard
7. Write setup instructions
8. Write lessons learned

**Output:** Complete documentation

**Learning:** Technical writing, documentation

---

## Portfolio Impact

### Before This Project

**Resume Bullet:**
> "Built inventory management system with Next.js and PostgreSQL"

**Recruiter Reaction:** 😐 "Another CRUD app"

**Perceived Level:** Junior/Mid-level SWE

---

### After This Project

**Resume Bullet:**
> "Built end-to-end data platform processing 10,000+ transactions with Apache Airflow ETL pipelines, dbt transformations, BigQuery warehouse, and ML-powered sales forecasting achieving 85% prediction accuracy. Increased SME profitability by ₱30,000/month through data-driven inventory optimization."

**Recruiter Reaction:** 🤩 "This person knows data engineering!"

**Perceived Level:** Data Engineer / Analytics Engineer

---

### What Recruiters See

**Technical Skills Demonstrated:**
- ✅ ETL pipeline development
- ✅ Data warehouse architecture
- ✅ SQL transformations (dbt)
- ✅ Workflow orchestration (Airflow)
- ✅ Data modeling (star schema)
- ✅ Machine learning (forecasting)
- ✅ Data quality engineering
- ✅ Cloud platforms (BigQuery/Snowflake)

**Business Skills Demonstrated:**
- ✅ Understanding business problems
- ✅ Translating requirements to technical solutions
- ✅ Measuring business impact (₱30K/month)
- ✅ Building for real users (Filipino SMEs)

---

### Interview Talking Points

**Question:** "Tell me about a challenging project"

**Your Answer:**
> "I built a data platform for Filipino SMEs that increased their profitability by ₱30,000/month. The challenge was processing messy real-world data from multiple sources. I used Apache Airflow to orchestrate ETL pipelines, dbt for transformations, and BigQuery for the warehouse. The most interesting part was implementing ML forecasting that predicts sales with 85% accuracy, helping store owners prevent stockouts. I learned that data engineering isn't just about moving data—it's about creating business value."

---

## Learning Roadmap

### Core Concepts You'll Master

#### 1. Data Engineering Fundamentals
- ETL vs ELT patterns
- OLTP vs OLAP databases
- Data warehouse architecture
- Data modeling (star schema, snowflake schema)
- Idempotency and incremental loads

#### 2. Apache Airflow
- DAG creation and scheduling
- Task dependencies
- Operators (Python, SQL, Bash)
- XComs for task communication
- Error handling and retries
- Monitoring and alerting

#### 3. dbt (Data Build Tool)
- Model creation (staging, intermediate, marts)
- Jinja templating
- Macros and packages
- Testing (generic and custom)
- Documentation generation
- Incremental models
- Slowly changing dimensions (SCD)

#### 4. Data Warehousing
- BigQuery or Snowflake architecture
- Partitioning and clustering
- Query optimization
- Cost management
- Security and access control

#### 5. Data Quality
- Completeness checks
- Uniqueness validation
- Referential integrity
- Anomaly detection
- Data profiling
- Reconciliation

#### 6. Machine Learning (Time Series)
- Prophet (Facebook's forecasting tool)
- ARIMA models
- Feature engineering for time series
- Model evaluation (MAPE, RMSE)
- Handling seasonality

#### 7. SQL Advanced
- Window functions
- CTEs (Common Table Expressions)
- Aggregations and grouping
- Joins and subqueries
- Performance optimization

---

### Resources for Learning

#### Apache Airflow
- Official docs: https://airflow.apache.org/
- Tutorial: "Data Engineering with Apache Airflow" (book)
- YouTube: "Airflow Tutorial for Beginners"

#### dbt
- Official docs: https://docs.getdbt.com/
- dbt Learn: https://courses.getdbt.com/
- YouTube: "dbt Fundamentals"

#### Data Warehousing
- BigQuery docs: https://cloud.google.com/bigquery/docs
- Snowflake docs: https://docs.snowflake.com/
- Book: "The Data Warehouse Toolkit" by Kimball

#### Data Modeling
- Star Schema: "The Data Warehouse Toolkit"
- Dimensional Modeling: Kimball methodology
- YouTube: "Star Schema vs Snowflake Schema"

#### Machine Learning
- Prophet: https://facebook.github.io/prophet/
- Time Series: "Forecasting: Principles and Practice" (free online)
- YouTube: "Time Series Forecasting with Prophet"

---

## Next Steps

### 1. Review Requirements Document
- Read `.kiro/specs/enterprise-data-platform/requirements.md`
- Understand each requirement
- Ask questions about unclear parts

### 2. Proceed to Design Phase
- Create technical architecture
- Design data models
- Plan implementation approach

### 3. Start Implementation
- Begin with Phase 1 (Data Generation)
- Work through phases sequentially
- Learn as you build

### 4. Document Everything
- Take screenshots
- Write explanations
- Create diagrams
- Build portfolio

---

## Conclusion

This isn't just a technical exercise—it's about solving real problems for real users. Filipino SME owners like Maria struggle with inventory management, lose money from stockouts, and can't get business loans because they lack data.

Your data platform gives them the same analytics capabilities that big companies have. That's the story you tell recruiters. That's what makes your portfolio stand out.

**You're not just learning data engineering. You're building something that matters.**

---

## Questions?

As you work through this project, you'll have questions. That's expected and encouraged. The spec workflow is designed to be iterative—we'll refine requirements, adjust designs, and learn together.

Ready to proceed with the design phase?
