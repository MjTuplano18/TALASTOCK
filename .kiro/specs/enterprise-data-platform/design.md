# Design Document: Enterprise Data Platform - Phase 1 (Data Generator)

## Overview

This design document covers Phase 1 of the Enterprise Data Platform transformation: **Realistic Business Data Generation**. This is the foundation that will feed all subsequent ETL pipelines and analytics.

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────┐
│   Data Generator (Python)              │
│                                         │
│   ├── Configuration                    │
│   │   └── Filipino product catalog     │
│   │                                     │
│   ├── Generators                       │
│   │   ├── Product Generator            │
│   │   ├── Sales Generator              │
│   │   └── Customer Generator           │
│   │                                     │
│   └── Exporters                        │
│       ├── CSV Exporter                 │
│       ├── JSON Exporter                │
│       ├── Excel Exporter               │
│       └── TSV Exporter                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Output Files (Multiple Formats)      │
│                                         │
│   ├── products.csv                     │
│   ├── sales_format1.csv                │
│   ├── sales_format2.json               │
│   ├── sales_messy.xlsx                 │
│   └── data_dictionary.md               │
└─────────────────────────────────────────┘
```

---

## Component Design

### 1. Product Generator

**Purpose:** Generate realistic Filipino product catalog

**Data Model:**
```python
Product = {
    'sku': str,           # e.g., "LM-PC-001"
    'name': str,          # e.g., "Lucky Me Pancit Canton"
    'category': str,      # Food, Beverage, Essentials, etc.
    'brand': str,         # Lucky Me, Nescafé, Coca-Cola, etc.
    'price': float,       # Retail price in PHP
    'cost_price': float,  # Cost price (70-80% of retail)
    'unit': str,          # piece, pack, bottle, etc.
    'supplier': str       # Optional supplier name
}
```

**Filipino Product Categories:**
- Food (instant noodles, canned goods, snacks)
- Beverage (soft drinks, coffee, juice)
- Essentials (rice, cooking oil, condiments)
- Household (detergent, soap, cleaning supplies)
- Personal Care (shampoo, toothpaste, soap)

**Real Brands to Include:**
- Lucky Me (instant noodles)
- Nescafé (coffee)
- Coca-Cola, Sprite, Royal (soft drinks)
- San Miguel (beer, food products)
- Colgate (toothpaste)
- Safeguard (soap)
- Tide (detergent)

---

### 2. Sales Generator

**Purpose:** Generate realistic sales transactions with temporal patterns

**Data Model:**
```python
Sale = {
    'transaction_id': str,
    'product_sku': str,
    'product_name': str,
    'quantity': int,
    'unit_price': float,
    'total_amount': float,
    'payment_method': str,  # Cash, GCash, Card
    'timestamp': datetime,
    'customer_type': str    # walk-in, regular
}
```

**Temporal Patterns:**

1. **Peak Hours:**
   - Morning: 7-9 AM (breakfast rush) - 30% of daily sales
   - Evening: 5-7 PM (dinner rush) - 40% of daily sales
   - Night: 8-10 PM (evening snacks) - 20% of daily sales
   - Off-peak: 10 AM - 5 PM - 10% of daily sales

2. **Day of Week:**
   - Weekdays: baseline
   - Saturday: +20% sales
   - Sunday: +15% sales

3. **Payday Patterns:**
   - 15th of month: +50% sales
   - 30th/31st of month: +50% sales
   - Days before payday: -10% sales

4. **Product Popularity:**
   - Top 20% products: 60% of sales (Pareto principle)
   - Middle 30% products: 30% of sales
   - Bottom 50% products: 10% of sales

---

### 3. Data Quality Issues (Intentional)

**Purpose:** Make data realistic by introducing common real-world issues

**Issue Types:**

1. **Missing Values (5-10%):**
   - Random missing product names
   - Missing payment methods
   - Missing customer types

2. **Duplicates (2-3%):**
   - Duplicate transaction IDs
   - Duplicate product SKUs

3. **Inconsistent Column Names:**
   - File 1: `product_name`, `quantity`, `price`
   - File 2: `Item`, `Qty`, `Amount`
   - File 3: `Product`, `Units`, `Total`

4. **Wrong Data Types:**
   - Quantity as string: "5" instead of 5
   - Price with currency: "₱50.00" instead of 50.00
   - Text in numeric fields: "ten" instead of 10

5. **Invalid Values:**
   - Negative quantities: -5
   - Zero prices: 0.00
   - Future dates

---

### 4. Export Formats

**Purpose:** Generate multiple file formats to test ETL flexibility

**Format 1: CSV (Standard)**
```csv
transaction_id,product_sku,product_name,quantity,unit_price,total_amount,payment_method,timestamp
TXN001,LM-PC-001,Lucky Me Pancit Canton,5,15.00,75.00,Cash,2026-04-01 08:30:00
```

**Format 2: JSON (API-like)**
```json
{
  "transactions": [
    {
      "id": "TXN001",
      "product": {
        "sku": "LM-PC-001",
        "name": "Lucky Me Pancit Canton"
      },
      "quantity": 5,
      "amount": 75.00,
      "payment": "Cash",
      "date": "2026-04-01T08:30:00Z"
    }
  ]
}
```

**Format 3: Excel (Business User)**
- Multiple sheets: Products, Sales, Summary
- Formatted headers
- Some merged cells (to test parsing)

**Format 4: TSV (Alternative)**
- Tab-separated values
- Different column order

---

## File Structure

```
data-platform/
├── data-generator/
│   ├── generate_data.py          # Main entry point
│   ├── config.py                 # Configuration
│   ├── generators/
│   │   ├── __init__.py
│   │   ├── products.py           # Product generation logic
│   │   ├── sales.py              # Sales generation logic
│   │   └── patterns.py           # Temporal pattern logic
│   ├── exporters/
│   │   ├── __init__.py
│   │   ├── csv_exporter.py
│   │   ├── json_exporter.py
│   │   ├── excel_exporter.py
│   │   └── tsv_exporter.py
│   ├── data/
│   │   └── filipino_products.json # Product catalog
│   ├── output/                   # Generated files (gitignored)
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Usage instructions
└── docs/
    └── DATA_GENERATOR_GUIDE.md   # Documentation
```

---

## Technology Stack

### Core Libraries

1. **Faker** - Generate fake but realistic data
   - Names, addresses, dates
   - Custom providers for Filipino data

2. **Pandas** - Data manipulation
   - DataFrame operations
   - Export to CSV, Excel

3. **NumPy** - Statistical distributions
   - Normal distribution for prices
   - Poisson distribution for quantities

4. **openpyxl** - Excel file generation
   - Multiple sheets
   - Formatting

### Dependencies

```txt
faker==24.0.0
pandas==2.2.0
numpy==1.26.0
openpyxl==3.1.2
python-dateutil==2.9.0
```

---

## Configuration

### config.py

```python
# Data generation parameters
NUM_PRODUCTS = 100
NUM_SALES_RECORDS = 10000
DATE_RANGE_MONTHS = 6

# Temporal patterns
PEAK_HOURS = {
    'morning': (7, 9, 0.30),   # 7-9 AM, 30% of sales
    'evening': (17, 19, 0.40),  # 5-7 PM, 40% of sales
    'night': (20, 22, 0.20),    # 8-10 PM, 20% of sales
}

PAYDAY_BOOST = 1.5  # 50% increase on payday
WEEKEND_BOOST = 1.2  # 20% increase on weekends

# Data quality issues
MISSING_VALUE_RATE = 0.08  # 8% missing values
DUPLICATE_RATE = 0.025      # 2.5% duplicates

# Filipino product brands
BRANDS = {
    'Food': ['Lucky Me', 'Nissin', 'Payless', 'Argentina'],
    'Beverage': ['Coca-Cola', 'Pepsi', 'Nescafé', 'San Miguel'],
    'Essentials': ['Datu Puti', 'Silver Swan', 'UFC', 'Del Monte'],
    'Household': ['Tide', 'Surf', 'Downy', 'Joy'],
    'Personal Care': ['Safeguard', 'Palmolive', 'Colgate', 'Head & Shoulders']
}
```

---

## Usage

### Generate Data

```bash
cd data-platform/data-generator
python generate_data.py --products 100 --sales 10000 --months 6
```

### Output

```
output/
├── products.csv                    # Product catalog
├── sales_standard.csv              # Standard format
├── sales_api_format.json           # JSON format
├── sales_messy.xlsx                # Excel with issues
├── sales_alternative.tsv           # TSV format
└── data_dictionary.md              # Field documentation
```

---

## Educational Notes

### Why Faker?
- **What:** Library for generating fake data
- **Why:** Produces realistic-looking data without manual creation
- **How:** Provides providers for names, dates, addresses, etc.
- **Alternative:** Manual data creation (time-consuming, less realistic)

### Why Temporal Patterns?
- **What:** Time-based sales variations
- **Why:** Real businesses have peak hours, payday effects
- **How:** Probability distributions based on time of day/month
- **Value:** Makes ETL testing more realistic

### Why Multiple Formats?
- **What:** Same data in CSV, JSON, Excel, TSV
- **Why:** Real businesses receive data in various formats
- **How:** Different exporter classes for each format
- **Value:** Tests ETL flexibility and robustness

### Why Introduce Errors?
- **What:** Intentional missing values, duplicates, wrong types
- **Why:** Real data is messy; ETL must handle it
- **How:** Random sampling to introduce issues
- **Value:** Tests data quality monitoring and error handling

---

## Next Steps

After Phase 1 (Data Generator):
1. Phase 2: ETL Pipeline (Apache Airflow)
2. Phase 3: Data Warehouse (BigQuery)
3. Phase 4: dbt Transformations

---

**Status:** Ready for Implementation  
**Estimated Time:** 1-2 days  
**Complexity:** Low-Medium
