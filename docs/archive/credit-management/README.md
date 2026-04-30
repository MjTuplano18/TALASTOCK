# Credit Management System Documentation

This directory contains comprehensive documentation for the Talastock Credit Management System.

## Documentation Files

### Overview & Setup
- **CREDIT_MANAGEMENT_MIGRATION_README.md** - Complete migration guide and system overview
- **QUICK_START_CREDIT_MANAGEMENT.md** - Quick start guide for setting up credit management

### Technical Documentation
- **CREDIT_SALES_FLOW_EXPLANATION.md** - Detailed explanation of credit sales workflow
- **TASK_1_COMPLETION_SUMMARY.md** - Database schema implementation summary
- **TASK_3_CREDIT_SALES_API_SUMMARY.md** - Credit sales API endpoints documentation
- **TASK_5_PAYMENTS_API_SUMMARY.md** - Payment recording API documentation
- **TASK_6_BALANCE_REPORTS_API_SUMMARY.md** - Balance reports API documentation

## Quick Links

### For Setup
1. Start with [QUICK_START_CREDIT_MANAGEMENT.md](QUICK_START_CREDIT_MANAGEMENT.md)
2. Review [CREDIT_MANAGEMENT_MIGRATION_README.md](CREDIT_MANAGEMENT_MIGRATION_README.md)
3. Run migrations from `/database/migrations/`

### For Development
- API endpoints: See TASK_*_API_SUMMARY.md files
- Credit flow: See CREDIT_SALES_FLOW_EXPLANATION.md
- Database schema: See TASK_1_COMPLETION_SUMMARY.md

### For Testing
- See `/docs/guides/TEST_CREDIT_FEATURES.md` for testing guide

## Credit Management Features

### Customer Management
- Credit limits
- Payment terms
- Balance tracking
- Credit utilization monitoring

### Credit Sales
- Record sales on credit
- Automatic balance updates
- Credit limit enforcement
- Payment method tracking

### Payment Recording
- Record customer payments
- Automatic balance deduction
- Payment history tracking
- Receipt generation

### Reports & Analytics
- Customer statements
- Credit summary reports
- Aging reports
- Credit utilization charts
- Payment collection trends

## Database Schema

The credit management system includes:
- `customers` table - Customer information and credit limits
- `credit_sales` table - Credit sales transactions
- `credit_payments` table - Payment records
- `credit_transactions` table - Transaction history
- RLS policies for security
- Triggers for automatic balance updates

## API Endpoints

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Credit Sales
- `GET /api/v1/credit-sales` - List credit sales
- `POST /api/v1/credit-sales` - Record credit sale
- `GET /api/v1/credit-sales/trend` - Sales trend data

### Payments
- `GET /api/v1/payments` - List payments
- `POST /api/v1/credit-sales/payments` - Record payment
- `GET /api/v1/payments/trend` - Payment trend data

### Reports
- `GET /api/v1/reports/credit-summary` - Credit summary
- `GET /api/v1/reports/credit-kpis` - Credit KPIs
- `GET /api/v1/reports/customer-statement/:id` - Customer statement

## Frontend Components

### Pages
- `/dashboard` - Credit tab with KPIs and charts
- `/customers` - Customer management
- `/credit-sales` - Credit sales list
- `/reports` - Credit reports

### Components
- `CreditDashboardTab` - Credit dashboard
- `CustomerForm` - Customer creation/editing
- `RecordPaymentModal` - Payment recording
- `CreditReports` - Report generation

## Related Documentation

- [Test Credit Features](../guides/TEST_CREDIT_FEATURES.md)
- [Database Migrations](../../database/migrations/README.md)
- [Deployment Guide](../deployment/DEPLOYMENT_SUMMARY.md)

## Support

For issues or questions:
1. Check the relevant documentation file
2. Review API summaries for endpoint details
3. Check database schema in TASK_1_COMPLETION_SUMMARY.md
4. Review credit flow in CREDIT_SALES_FLOW_EXPLANATION.md
