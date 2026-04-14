# Implementation Plan: Talastock Inventory Dashboard

## Overview

This implementation plan follows a frontend-first approach, building the Next.js foundation, authentication, and UI components before implementing backend services. The plan prioritizes getting a working UI with mock data first, then connecting to real backend APIs and database.

## Tasks

- [-] 1. Frontend foundation setup
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and Tailwind CSS
    - Create Next.js app in `/frontend` directory with App Router
    - Configure TypeScript with strict mode
    - Set up Tailwind CSS with custom Talastock color palette
    - Install and configure shadcn/ui base components
    - _Requirements: 10.1, 10.4_

  - [x] 1.2 Set up project structure and base layout
    - Create folder structure: `app/`, `components/`, `hooks/`, `lib/`, `types/`
    - Implement root layout with global styles
    - Create dashboard layout with sidebar navigation
    - Add responsive mobile navigation
    - _Requirements: 10.2, 10.3_

  - [x] 1.3 Create TypeScript type definitions
    - Define all data types in `types/index.ts` (Product, Category, Inventory, Sale, etc.)
    - Create form input types (ProductCreate, SaleCreate, etc.)
    - Define API response types and error types
    - _Requirements: 2.1, 4.1, 6.1_

  - [ ]* 1.4 Write unit tests for utility functions
    - Test currency formatting (formatCurrency)
    - Test stock status calculation (getStockStatus)
    - Test date formatting utilities
    - _Requirements: 2.8, 4.6_

- [ ] 2. Authentication implementation
  - [x] 2.1 Set up Supabase client and authentication
    - Install Supabase packages (@supabase/auth-helpers-nextjs)
    - Configure Supabase client in `lib/supabase.ts`
    - Create auth helper functions (signIn, signOut, getSession)
    - Set up environment variables for Supabase
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Create login page and authentication flow
    - Build login page UI with email/password form
    - Implement form validation with Zod
    - Add error handling for failed login attempts
    - Display success/error toast notifications
    - _Requirements: 1.1, 1.3, 11.5, 11.6, 14.3_

  - [x] 2.3 Implement route protection middleware
    - Create Next.js middleware for auth verification
    - Protect dashboard routes (dashboard, products, inventory, sales, reports)
    - Redirect unauthenticated users to login page
    - Handle session refresh automatically
    - _Requirements: 1.4, 1.6, 12.4_

  - [ ]* 2.4 Write integration tests for authentication flow
    - Test successful login flow
    - Test failed login with invalid credentials
    - Test session expiration and refresh
    - Test route protection middleware
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Checkpoint - Verify authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Database schema and setup
  - [x] 4.1 Create Supabase database schema
    - Run SQL migrations to create all tables (categories, products, inventory, stock_movements, sales, sale_items)
    - Add database indexes for performance optimization
    - Set up foreign key constraints and cascading deletes
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1_

  - [x] 4.2 Enable Row Level Security policies
    - Enable RLS on all tables
    - Create policies for authenticated user access (read, insert, update, delete)
    - Test RLS policies with authenticated and unauthenticated requests
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 4.3 Write database integration tests
    - Test product creation with automatic inventory record
    - Test RLS policy enforcement
    - Test foreign key constraints
    - Test cascading deletes
    - _Requirements: 2.3, 12.1, 12.2_

- [ ] 5. UI component library
  - [x] 5.1 Create base UI components
    - Install shadcn/ui components (button, input, dialog, select, table, badge, card)
    - Customize components with Talastock color palette
    - Create MetricCard component for dashboard KPIs
    - Create StockBadge component for inventory status
    - _Requirements: 10.1, 10.4, 10.8_

  - [x] 5.2 Create layout components
    - Build Sidebar component with navigation links
    - Create Header component with user menu
    - Build EmptyState component for empty lists
    - Create LoadingSkeleton components for data loading
    - _Requirements: 10.2, 10.5, 10.6_

  - [x] 5.3 Create shared utility components
    - Build toast notification system (using sonner)
    - Create reusable form input wrappers with Talastock styling
    - Build confirmation dialog component
    - _Requirements: 10.7, 11.6_

  - [ ]* 5.4 Write component unit tests
    - Test MetricCard rendering with different props
    - Test StockBadge status colors
    - Test EmptyState display
    - Test LoadingSkeleton rendering
    - _Requirements: 10.1, 10.4, 10.5, 10.6_

- [ ] 6. Category management
  - [x] 6.1 Create category data hooks and API integration
    - Build useCategories hook for fetching categories
    - Create Supabase query functions (getCategories, createCategory, updateCategory, deleteCategory)
    - Add error handling and loading states
    - _Requirements: 3.1, 14.1, 14.2_

  - [x] 6.2 Build category management UI
    - Create category list view with table
    - Build category form dialog (create/edit)
    - Add form validation for category name uniqueness
    - Implement delete confirmation dialog
    - _Requirements: 3.1, 3.2, 11.1, 11.6_

  - [ ]* 6.3 Write integration tests for category management
    - Test category creation
    - Test category name uniqueness validation
    - Test category update
    - Test category deletion with product reassignment
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 7. Product management
  - [x] 7.1 Create product data hooks and API integration
    - Build useProducts hook for fetching products with categories and inventory
    - Create Supabase query functions (getProducts, createProduct, updateProduct, deleteProduct)
    - Implement optimistic UI updates for better UX
    - Add pagination support (20 items per page)
    - _Requirements: 2.1, 2.6, 2.7, 13.3_

  - [x] 7.2 Build products table component
    - Create ProductsTable with TanStack Table
    - Display columns: name, SKU, category, stock quantity, price, status
    - Add sorting and filtering capabilities
    - Format prices in Philippine Peso with thousand separators
    - Show stock status badges (in stock, low stock, out of stock)
    - _Requirements: 2.6, 2.7, 2.8, 4.6_

  - [x] 7.3 Build product form dialog
    - Create ProductForm component with all fields (name, SKU, category, price, cost_price, image_url)
    - Implement form validation with Zod (required fields, unique SKU, non-negative prices)
    - Add category dropdown selector
    - Handle create and edit modes
    - Display inline validation errors
    - _Requirements: 2.1, 2.4, 11.1, 11.2, 11.3, 11.6, 11.7_

  - [x] 7.4 Build products page with CRUD operations
    - Create products list page at `/products`
    - Add "Add Product" button to open form dialog
    - Implement edit action (opens form with existing data)
    - Implement soft delete action (sets is_active to false)
    - Show empty state when no products exist
    - _Requirements: 2.1, 2.4, 2.5, 10.5_

  - [ ]* 7.5 Write integration tests for product management
    - Test product creation with automatic inventory record
    - Test SKU uniqueness validation
    - Test product update
    - Test soft delete (is_active = false)
    - Test product list with pagination
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Checkpoint - Verify product management works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Inventory tracking
  - [x] 9.1 Create inventory data hooks with real-time updates
    - Build useInventory hook for fetching inventory data
    - Implement useRealtimeInventory hook with Supabase subscriptions
    - Create query functions (getInventory, getLowStockProducts, updateInventory, adjustInventory)
    - Handle connection interruptions and reconnection
    - _Requirements: 4.1, 4.2, 8.1, 8.4, 8.5_

  - [x] 9.2 Build inventory table component
    - Create InventoryTable showing product name, SKU, quantity, threshold, status
    - Display stock status badges with color coding
    - Add filter for low stock items
    - Show last updated timestamp
    - _Requirements: 4.1, 4.2, 4.6, 4.7_

  - [x] 9.3 Build inventory adjustment form
    - Create InventoryAdjustmentForm dialog
    - Add quantity input and note field (required)
    - Validate quantity is non-negative integer
    - Create stock movement record on adjustment
    - Update inventory quantity
    - _Requirements: 4.4, 4.5, 5.5, 11.4_

  - [x] 9.4 Build inventory page with low stock view
    - Create inventory list page at `/inventory`
    - Add "Adjust Stock" action for each product
    - Create dedicated low stock products view
    - Display low stock indicator prominently
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [ ]* 9.5 Write integration tests for inventory tracking
    - Test inventory adjustment creates stock movement
    - Test low stock threshold detection
    - Test real-time inventory updates
    - Test stock status badge calculation
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 10. Stock movement history
  - [x] 10.1 Create stock movement data hooks
    - Build useStockMovements hook for fetching movement history
    - Create query function to get movements by product
    - Support all movement types (restock, sale, adjustment, return)
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 10.2 Build stock movement history view
    - Create StockMovementTable component
    - Display columns: type, quantity, note, created_by, timestamp
    - Show movements in chronological order (newest first)
    - Add filtering by movement type
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 10.3 Write integration tests for stock movements
    - Test stock movement creation
    - Test movement types (restock, sale, adjustment, return)
    - Test inventory quantity update on movement
    - Test movement history retrieval
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. Sales recording
  - [x] 11.1 Create sales data hooks and API integration
    - Build useSales hook for fetching sales with line items
    - Create query functions (getSales, createSale, getSaleById)
    - Implement transaction handling for sale creation
    - Add pagination support
    - _Requirements: 6.1, 6.2, 13.3_

  - [x] 11.2 Build sale form component
    - Create SaleForm with dynamic line items
    - Add product selector dropdown for each line item
    - Input fields: quantity, unit price (auto-filled from product)
    - Calculate and display subtotals for each line item
    - Calculate and display total sale amount
    - Add optional notes field
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.8_

  - [x] 11.3 Implement sale validation and inventory checks
    - Validate sale has at least one item
    - Check product quantity is sufficient before sale
    - Prevent sale if insufficient stock
    - Display clear error message for insufficient stock
    - _Requirements: 6.7, 11.7, 14.1_

  - [x] 11.4 Implement sale transaction logic
    - Create sale record with total amount
    - Create sale_items records for each line item
    - Create stock_movement records of type "sale"
    - Decrease inventory quantities for all sold products
    - Handle transaction rollback on error
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.9_

  - [x] 11.5 Build sales page with history
    - Create sales list page at `/sales`
    - Add "Record Sale" button to open form dialog
    - Display sales table with date, total amount, items count
    - Show sale details on row click
    - _Requirements: 6.1, 6.2_

  - [ ]* 11.6 Write integration tests for sales recording
    - Test sale creation with multiple line items
    - Test inventory decrease on sale
    - Test stock movement creation on sale
    - Test insufficient stock prevention
    - Test sale total calculation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 12. Checkpoint - Verify sales and inventory integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Dashboard with analytics
  - [x] 13.1 Create dashboard metrics hooks
    - Build useDashboardMetrics hook for fetching KPIs
    - Calculate total active products count
    - Calculate total inventory value (sum of quantity × cost_price)
    - Calculate total sales revenue for current period
    - Calculate low stock products count
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 13.2 Build dashboard KPI cards
    - Create dashboard page at `/dashboard`
    - Display MetricCard for total products
    - Display MetricCard for inventory value (formatted as ₱)
    - Display MetricCard for sales revenue
    - Display MetricCard for low stock count (with danger styling)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 13.3 Create chart data hooks
    - Build useSalesChart hook for sales trend data
    - Build useTopProducts hook for top selling products
    - Build useRevenueChart hook for revenue over time
    - Aggregate data by date/month
    - _Requirements: 7.5, 7.6, 7.7_

  - [x] 13.4 Build chart components with Talastock styling
    - Install shadcn/ui chart components
    - Create SalesChart component (line chart)
    - Create TopProductsChart component (bar chart)
    - Create RevenueChart component (area chart)
    - Apply Talastock color palette to all charts
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

  - [x] 13.5 Implement real-time dashboard updates
    - Subscribe to inventory changes via Supabase realtime
    - Update metrics when products are created/deleted
    - Update metrics when sales are recorded
    - Update charts when data changes
    - _Requirements: 7.9, 8.1, 8.2, 8.3_

  - [ ]* 13.6 Write integration tests for dashboard
    - Test metrics calculation accuracy
    - Test chart data aggregation
    - Test real-time updates on data changes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.9_

- [ ] 14. Backend API implementation
  - [ ] 14.1 Set up FastAPI project structure
    - Initialize FastAPI app in `/backend` directory
    - Create folder structure: `routers/`, `services/`, `models/`, `database/`, `dependencies/`, `middleware/`
    - Set up Supabase client for backend
    - Configure CORS with allowed origins
    - _Requirements: 12.6, 14.2_

  - [ ] 14.2 Create Pydantic models and validation
    - Define all Pydantic schemas in `models/schemas.py`
    - Add custom validators for non-empty strings, non-negative numbers
    - Create API response wrapper (APIResponse)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.7_

  - [ ] 14.3 Implement authentication dependency
    - Create auth dependency for token verification
    - Verify Supabase tokens on every protected request
    - Extract user ID from token
    - Return 401 for invalid/expired tokens
    - _Requirements: 1.1, 12.4, 14.3_

  - [ ] 14.4 Build products API router
    - Create `/api/v1/products` endpoints (GET, POST, PUT, DELETE)
    - Implement pagination with default page size 20
    - Add filtering by category
    - Include related category and inventory data in responses
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 13.3, 13.5_

  - [ ] 14.5 Build inventory API router
    - Create `/api/v1/inventory` endpoints (GET, PUT)
    - Implement `/api/v1/inventory/low-stock` endpoint
    - Create `/api/v1/inventory/{product_id}/adjust` endpoint
    - Update inventory and create stock movement on adjustment
    - _Requirements: 4.1, 4.4, 4.7_

  - [ ] 14.6 Build sales API router
    - Create `/api/v1/sales` endpoints (GET, POST)
    - Implement transaction handling for sale creation
    - Validate sufficient stock before creating sale
    - Create sale, sale_items, and stock_movements in transaction
    - Return 409 error for insufficient stock
    - _Requirements: 6.1, 6.2, 6.7, 14.1_

  - [ ] 14.7 Build categories API router
    - Create `/api/v1/categories` endpoints (GET, POST, PUT, DELETE)
    - Validate category name uniqueness
    - Handle category deletion with product reassignment
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 14.8 Implement error handling middleware
    - Create global exception handler
    - Return structured error responses with error codes
    - Log errors to console in development
    - Never expose sensitive error details to users
    - _Requirements: 14.1, 14.2, 14.4, 14.6_

  - [ ]* 14.9 Write API integration tests
    - Test all product endpoints
    - Test all inventory endpoints
    - Test all sales endpoints
    - Test authentication requirement
    - Test error responses
    - _Requirements: 2.1, 4.1, 6.1, 12.4, 14.1_

- [ ] 15. PDF report generation
  - [x] 15.1 Set up jsPDF for report generation
    - Install jsPDF library
    - Create report generation utilities
    - Configure Talastock branding and colors for PDFs
    - _Requirements: 9.5_

  - [x] 15.2 Build sales report generator
    - Create generateSalesReport function
    - Include date range, total revenue, itemized sales list
    - Format currency values in Philippine Peso
    - Add generation timestamp
    - Apply Talastock branding
    - _Requirements: 9.1, 9.3, 9.6, 9.7_

  - [x] 15.3 Build inventory report generator
    - Create generateInventoryReport function
    - Include product name, SKU, quantity, value
    - Calculate total inventory value
    - Format currency values in Philippine Peso
    - Add generation timestamp
    - _Requirements: 9.2, 9.4, 9.6, 9.7_

  - [x] 15.4 Build reports page with export functionality
    - Create reports page at `/reports`
    - Add date range selector for sales reports
    - Add "Export Sales Report" button
    - Add "Export Inventory Report" button
    - Trigger PDF download on button click
    - _Requirements: 9.1, 9.2_

  - [ ]* 15.5 Write integration tests for report generation
    - Test sales report PDF generation
    - Test inventory report PDF generation
    - Test date range filtering
    - Test currency formatting in PDFs
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 16. Final integration and polish
  - [ ] 16.1 Connect frontend to backend APIs
    - Update all frontend hooks to call FastAPI endpoints
    - Replace direct Supabase calls with API calls where appropriate
    - Add Bearer token to all API requests
    - Handle API errors with user-friendly messages
    - _Requirements: 12.4, 14.1, 14.2_

  - [ ] 16.2 Implement rate limiting
    - Add rate limiting middleware to FastAPI
    - Set limits: 10 requests/minute for write operations
    - Return 429 error when rate limit exceeded
    - _Requirements: 12.6_

  - [ ] 16.3 Add security headers
    - Configure Content Security Policy
    - Add X-Frame-Options, X-Content-Type-Options headers
    - Set Referrer-Policy
    - Enforce HTTPS in production
    - _Requirements: 12.6_

  - [ ] 16.4 Performance optimization
    - Implement optimistic UI updates for common operations
    - Add loading skeletons for all data fetching
    - Optimize database queries with proper indexes
    - Enable Next.js Server Components where possible
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 13.6, 13.7_

  - [ ] 16.5 Error handling polish
    - Ensure all errors show user-friendly messages
    - Add retry option for network errors
    - Log all errors appropriately
    - Test error scenarios (network failure, auth failure, validation errors)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 16.6 Write end-to-end tests
    - Test complete product management workflow
    - Test complete sales recording workflow
    - Test dashboard real-time updates
    - Test authentication and route protection
    - Test PDF report generation
    - _Requirements: 2.1, 6.1, 7.9, 1.1, 9.1_

- [ ] 17. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Frontend tasks (1-13, 15) should be completed before backend tasks (14) for faster iteration
- Checkpoints ensure incremental validation at key milestones
- Real-time features use Supabase subscriptions for live updates
- All currency values formatted in Philippine Peso (₱) with proper separators
- Security is built-in at every layer (RLS, auth tokens, input validation)
