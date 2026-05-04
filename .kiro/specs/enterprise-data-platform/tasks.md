# Tasks: Enterprise Data Platform - Phase 1 (Data Generator)

## Overview
Implementation tasks for the Realistic Business Data Generation feature.

---

## Task 1: Project Setup

### 1.1 Create Project Structure
- [ ] Create `data-platform/data-generator/` directory
- [ ] Create subdirectories: `generators/`, `exporters/`, `data/`, `output/`
- [ ] Create `__init__.py` files for Python packages
- [ ] Create `requirements.txt` with dependencies
- [ ] Create `.gitignore` for `output/` directory

### 1.2 Install Dependencies
- [ ] Create virtual environment
- [ ] Install Faker, Pandas, NumPy, openpyxl
- [ ] Test imports

---

## Task 2: Configuration Module

### 2.1 Create config.py
- [ ] Define data generation parameters (NUM_PRODUCTS, NUM_SALES_RECORDS)
- [ ] Define temporal patterns (PEAK_HOURS, PAYDAY_BOOST, WEEKEND_BOOST)
- [ ] Define data quality parameters (MISSING_VALUE_RATE, DUPLICATE_RATE)
- [ ] Define Filipino product brands dictionary
- [ ] Define product categories

---

## Task 3: Product Generator

### 3.1 Create Filipino Product Catalog
- [ ] Create `data/filipino_products.json` with 100 realistic products
- [ ] Include real brands (Lucky Me, Nescafé, Coca-Cola, etc.)
- [ ] Organize by categories (Food, Beverage, Essentials, Household, Personal Care)
- [ ] Add realistic prices in PHP

### 3.2 Implement Product Generator
- [ ] Create `generators/products.py`
- [ ] Implement `generate_products()` function
- [ ] Generate SKUs (e.g., "LM-PC-001")
- [ ] Calculate cost prices (70-80% of retail)
- [ ] Add product metadata (unit, supplier)
- [ ] Return Pandas DataFrame

---

## Task 4: Sales Generator

### 4.1 Implement Temporal Patterns
- [ ] Create `generators/patterns.py`
- [ ] Implement `get_hour_probability()` for peak hours
- [ ] Implement `get_day_boost()` for weekends
- [ ] Implement `is_payday()` for 15th and 30th
- [ ] Implement `get_product_popularity()` for Pareto distribution

### 4.2 Implement Sales Generator
- [ ] Create `generators/sales.py`
- [ ] Implement `generate_sales()` function
- [ ] Generate transaction IDs
- [ ] Apply temporal patterns to timestamps
- [ ] Apply product popularity (80/20 rule)
- [ ] Generate payment methods (Cash, GCash, Card)
- [ ] Calculate totals
- [ ] Return Pandas DataFrame

---

## Task 5: Data Quality Issues

### 5.1 Implement Missing Values
- [ ] Add function to randomly remove values (5-10%)
- [ ] Target specific columns (product_name, payment_method)

### 5.2 Implement Duplicates
- [ ] Add function to duplicate random rows (2-3%)

### 5.3 Implement Wrong Data Types
- [ ] Convert some quantities to strings
- [ ] Add currency symbols to prices
- [ ] Add text in numeric fields

### 5.4 Implement Invalid Values
- [ ] Add negative quantities
- [ ] Add zero prices
- [ ] Add future dates

---

## Task 6: Export Formats

### 6.1 CSV Exporter
- [ ] Create `exporters/csv_exporter.py`
- [ ] Implement standard CSV export
- [ ] Implement messy CSV with inconsistent column names

### 6.2 JSON Exporter
- [ ] Create `exporters/json_exporter.py`
- [ ] Implement nested JSON structure (API-like)

### 6.3 Excel Exporter
- [ ] Create `exporters/excel_exporter.py`
- [ ] Implement multi-sheet Excel
- [ ] Add formatting and merged cells

### 6.4 TSV Exporter
- [ ] Create `exporters/tsv_exporter.py`
- [ ] Implement tab-separated format with different column order

---

## Task 7: Main Script

### 7.1 Create generate_data.py
- [ ] Implement command-line arguments (--products, --sales, --months)
- [ ] Call product generator
- [ ] Call sales generator
- [ ] Apply data quality issues
- [ ] Export to all formats
- [ ] Generate data dictionary
- [ ] Print summary statistics

---

## Task 8: Documentation

### 8.1 Create README.md
- [ ] Installation instructions
- [ ] Usage examples
- [ ] Output file descriptions
- [ ] Configuration options

### 8.2 Create Data Dictionary
- [ ] Auto-generate data_dictionary.md
- [ ] Document all fields
- [ ] Include data types and valid ranges
- [ ] Add business meaning

---

## Task 9: Testing

### 9.1 Test Data Generation
- [ ] Run generator with 100 products, 10,000 sales
- [ ] Verify temporal patterns (peak hours, payday)
- [ ] Verify data quality issues are present
- [ ] Verify all export formats work

### 9.2 Validate Output
- [ ] Check CSV files open correctly
- [ ] Check JSON is valid
- [ ] Check Excel has multiple sheets
- [ ] Check TSV is tab-separated

---

## Task 10: Integration

### 10.1 Commit and Push
- [ ] Add all files to git
- [ ] Commit with descriptive message
- [ ] Push to feature branch

### 10.2 Documentation Update
- [ ] Update main README with data generator info
- [ ] Add link to DATA_GENERATOR_GUIDE.md

---

## Acceptance Criteria

- [ ] Generator creates 50-100 realistic Filipino products
- [ ] Generator creates 1,000-10,000 sales records
- [ ] Sales data shows realistic temporal patterns (peak hours, payday)
- [ ] Data includes 5-10% missing values
- [ ] Data includes 2-3% duplicates
- [ ] Data exports to CSV, JSON, Excel, TSV formats
- [ ] Each format has different schema (inconsistent columns)
- [ ] Data dictionary is auto-generated
- [ ] All code is documented
- [ ] README includes usage instructions

---

**Status:** Ready to Start  
**Estimated Time:** 1-2 days  
**Priority:** High (Foundation for all other features)
