# Documentation Structure

This directory contains all project documentation organized by category.

## Directory Structure

### `/fixes`
Bug fixes, issue resolutions, and troubleshooting documentation.
- API fixes
- CORS issues
- Credit system fixes
- Dashboard fixes
- Refund/void fixes
- UI/UX fixes

### `/deployment`
Deployment guides, status updates, and production-related documentation.
- Render deployment guides
- Vercel deployment guides
- Deployment status and summaries
- Cold start explanations

### `/guides`
Step-by-step guides and tutorials for developers.
- How to restart frontend/backend
- Database migration guides
- Testing guides
- Feature usage guides

### `/summaries`
Analysis, summaries, and explanations of features and behaviors.
- Feature analysis
- Behavior explanations
- Implementation summaries
- Technical decisions

### `/archive`
Historical documentation from previous development phases.
- Improvements archive
- POS system archive
- Testing archive

## Quick Links

### For Developers
- [Restart Frontend Guide](guides/RESTART_FRONTEND.md)
- [Start Backend Server](guides/START_BACKEND_SERVER.md)
- [Test Credit Features](guides/TEST_CREDIT_FEATURES.md)

### For Deployment
- [Deployment Summary](deployment/DEPLOYMENT_SUMMARY.md)
- [CORS Fix Guide](fixes/FIX_CORS_AND_ERRORS.md)

### For Troubleshooting
- [Calendar & Chart Responsiveness Fix](fixes/CALENDAR_AND_CHART_RESPONSIVENESS_FIX.md)
- [Credit Reports 404 Fix](fixes/FIX_CREDIT_REPORTS_404.md)

## Database Scripts

SQL scripts and database-related files are located in `/database/scripts/`:
- Migration scripts
- Fix scripts
- Test scripts
- Cleanup scripts

## Contributing

When adding new documentation:
1. Choose the appropriate category folder
2. Use descriptive filenames in UPPERCASE with underscores
3. Include date or version if relevant
4. Update this README if adding a new category
