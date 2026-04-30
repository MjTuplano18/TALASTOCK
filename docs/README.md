# Talastock Documentation

> Complete documentation for Talastock - A modern inventory and sales management system for Filipino SMEs.

---

## 📚 Quick Navigation

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[User Guide](USER_GUIDE.md)** - End-user documentation
- **[FAQ](FAQ.md)** - Frequently asked questions

### Feature Documentation
- **[ETL & Import History](features/ETL_GUIDE.md)** - Import tracking, rollback, quality monitoring
- **[Rollback Feature](features/ROLLBACK_GUIDE.md)** - Revert bad imports with snapshots

### Project Information
- **[Complete Feature Summary](COMPLETE_FEATURE_SUMMARY.md)** - All implemented features
- **[Current System Status](CURRENT_SYSTEM_STATUS.md)** - System health and status
- **[Roadmap](ROADMAP.md)** - Future development plans
- **[Enterprise Data Platform Guide](ENTERPRISE_DATA_PLATFORM_GUIDE.md)** - Transform into data platform

### Deployment
- **[Production Checklist](deployment/PRODUCTION_CHECKLIST.md)** - Pre-launch checklist
- **[Backend Deployment](deployment/BACKEND_DEPLOYMENT.md)** - Deploy backend to Railway/Render

### Development
- **[Troubleshooting](development/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🏗️ Project Structure

```
Talastock/
├── frontend/          # Next.js 14 frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API clients
│   └── types/        # TypeScript types
│
├── backend/           # FastAPI backend
│   ├── routers/      # API endpoints
│   ├── models/       # Pydantic schemas
│   ├── database/     # Database connection
│   └── middleware/   # Auth, logging, rate limiting
│
├── database/          # Database files
│   ├── migrations/   # SQL migrations
│   └── schema/       # Database schema
│
└── docs/             # Documentation (you are here)
    ├── features/     # Feature-specific guides
    ├── deployment/   # Deployment guides
    ├── development/  # Developer resources
    └── archive/      # Historical documentation
```

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **State Management:** React Query
- **Auth:** Supabase Auth

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase JWT
- **Validation:** Pydantic v2
- **API Docs:** OpenAPI/Swagger

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway/Render
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage

---

## 📖 Core Features

### Inventory Management
- Product CRUD operations
- Category management
- Stock level tracking
- Low stock alerts
- Bulk import/export

### Sales Management
- POS-style sales recording
- Multiple payment methods (Cash, GCash, Card, Credit)
- Sales history and filtering
- Refund/void transactions
- Receipt generation

### Customer Credit Management
- Credit limit tracking
- Credit sales recording
- Payment collection
- Credit history
- Outstanding balance reports

### ETL & Data Quality
- Import history tracking
- Rollback capability
- Quality score calculation
- Column mapping templates
- Statistics dashboard

### Reports & Analytics
- Sales reports (daily, weekly, monthly)
- Inventory reports
- Profit analysis
- Top products
- Payment method breakdown
- Export to PDF

---

## 🎯 Target Users

Talastock is built for Filipino SMEs:
- Sari-sari stores
- Mini groceries
- Trading businesses (Binondo)
- Retail shops
- Restaurant and food businesses

---

## 🔐 Security Features

- **Authentication:** JWT-based auth via Supabase
- **Authorization:** Row Level Security (RLS)
- **API Security:** Rate limiting, CORS, input validation
- **Data Protection:** Encrypted at rest and in transit
- **Audit Trail:** Complete history of all operations

---

## 📝 Documentation Standards

### File Naming
- Use SCREAMING_SNAKE_CASE for documentation files
- Use kebab-case for feature directories
- Example: `ETL_GUIDE.md`, `features/etl-guide/`

### Document Structure
1. **Title and Description** - What this document covers
2. **Overview** - High-level summary
3. **Quick Start** - Get started quickly
4. **Detailed Sections** - In-depth information
5. **API Reference** - If applicable
6. **Troubleshooting** - Common issues
7. **Related Documentation** - Links to other docs

---

## 🤝 Contributing

### Documentation Updates
1. Keep docs concise and actionable
2. Include code examples
3. Add screenshots for UI features
4. Update the main README when adding new docs
5. Archive outdated documentation (don't delete)

### Code Documentation
1. Add JSDoc comments to functions
2. Document complex logic
3. Include usage examples
4. Keep comments up-to-date

---

## 📞 Support

### For Users
- Check the [User Guide](USER_GUIDE.md)
- Read the [FAQ](FAQ.md)
- Contact support (if applicable)

### For Developers
- Check [Troubleshooting](development/TROUBLESHOOTING.md)
- Review feature documentation in `features/`
- Check the [Roadmap](ROADMAP.md) for planned features

---

## 📜 License

[Add your license information here]

---

## 🙏 Acknowledgments

Built with:
- Next.js by Vercel
- FastAPI by Sebastián Ramírez
- Supabase
- shadcn/ui by shadcn
- Tailwind CSS

---

**Last Updated:** April 30, 2026  
**Documentation Version:** 2.0  
**Status:** ✅ Active Development
