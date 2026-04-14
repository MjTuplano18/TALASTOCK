# Requirements Document

## Introduction

Talastock is a complete inventory and sales management dashboard designed for Filipino small-to-medium enterprises (SMEs), including Binondo trading companies, sari-sari stores, and restaurants. The system provides real-time inventory tracking, sales recording, analytics dashboards, and reporting capabilities with a warm, modern user interface optimized for Philippine business operations.

## Glossary

- **System**: The Talastock inventory and sales management application
- **User**: An authenticated person using the Talastock system
- **Product**: An item tracked in inventory with SKU, price, and stock quantity
- **Inventory**: The current stock quantity and threshold data for products
- **Sale**: A transaction recording the sale of one or more products
- **Category**: A classification group for organizing products
- **Stock_Movement**: A record of inventory changes (restock, sale, adjustment, return)
- **Dashboard**: The main analytics view showing KPIs and charts
- **Low_Stock_Alert**: A notification when product quantity falls below threshold
- **Report**: An exportable PDF document containing sales or inventory data
- **Auth_System**: Supabase authentication service managing user sessions
- **Database**: Supabase PostgreSQL database storing all application data
- **Frontend**: Next.js 14 application with TypeScript and Tailwind CSS
- **Backend**: Python FastAPI service handling business logic
- **Real_Time_Updates**: Live data synchronization using Supabase realtime subscriptions

## Requirements

### Requirement 1: User Authentication

**User Story:** As a business owner, I want to securely log in to the system, so that only authorized users can access my business data.

#### Acceptance Criteria

1. THE Auth_System SHALL authenticate users using email and password
2. WHEN a user successfully logs in, THE Auth_System SHALL create a session with access and refresh tokens
3. WHEN a user logs out, THE Auth_System SHALL invalidate the session tokens
4. IF an unauthenticated user attempts to access protected routes, THEN THE System SHALL redirect them to the login page
5. THE Auth_System SHALL store session tokens in httpOnly cookies
6. WHEN a session expires, THE Auth_System SHALL automatically refresh the token if a valid refresh token exists

### Requirement 2: Product Management

**User Story:** As a business owner, I want to create, view, update, and delete products, so that I can maintain an accurate product catalog.

#### Acceptance Criteria

1. THE System SHALL allow users to create products with name, SKU, category, price, cost price, and image URL
2. THE System SHALL enforce unique SKU values for all products
3. WHEN a user creates a product, THE System SHALL automatically create a corresponding inventory record with default quantity of 0
4. THE System SHALL allow users to update product information including name, price, cost price, category, and active status
5. THE System SHALL allow users to soft-delete products by setting is_active to false
6. THE System SHALL display products in a table with sorting and filtering capabilities
7. WHEN displaying products, THE System SHALL show associated category name and current stock quantity
8. THE System SHALL format prices in Philippine Peso (₱) with proper thousand separators

### Requirement 3: Category Management

**User Story:** As a business owner, I want to organize products into categories, so that I can better manage my inventory.

#### Acceptance Criteria

1. THE System SHALL allow users to create product categories with unique names
2. THE System SHALL allow users to assign products to categories
3. THE System SHALL allow users to filter products by category
4. WHEN a category is deleted, THE System SHALL set the category_id to null for associated products

### Requirement 4: Inventory Tracking

**User Story:** As a business owner, I want to track stock quantities and receive low stock alerts, so that I can restock products before they run out.

#### Acceptance Criteria

1. THE System SHALL maintain current stock quantity for each product
2. THE System SHALL allow users to set a low stock threshold for each product with a default value of 10
3. WHEN stock quantity is less than or equal to the low stock threshold, THE System SHALL display a low stock indicator
4. THE System SHALL allow users to manually adjust inventory quantities with a note explaining the adjustment
5. WHEN inventory is adjusted, THE System SHALL create a stock movement record with type "adjustment"
6. THE System SHALL display stock status badges (in stock, low stock, out of stock) based on quantity
7. THE System SHALL provide a dedicated view showing all low stock products

### Requirement 5: Stock Movement Recording

**User Story:** As a business owner, I want to track all inventory changes, so that I have a complete audit trail of stock movements.

#### Acceptance Criteria

1. THE System SHALL record stock movements with type, quantity, product reference, and timestamp
2. THE System SHALL support movement types: restock, sale, adjustment, and return
3. WHEN a stock movement is created, THE System SHALL update the corresponding inventory quantity
4. THE System SHALL record the user who created each stock movement
5. THE System SHALL allow users to add optional notes to stock movements
6. THE System SHALL display stock movement history for each product in chronological order

### Requirement 6: Sales Recording

**User Story:** As a business owner, I want to record sales transactions, so that I can track revenue and inventory depletion.

#### Acceptance Criteria

1. THE System SHALL allow users to create sales with multiple line items
2. WHEN a sale is created, THE System SHALL record each line item with product, quantity, and unit price
3. WHEN a sale is created, THE System SHALL automatically calculate subtotals for each line item
4. WHEN a sale is created, THE System SHALL calculate and store the total sale amount
5. WHEN a sale is created, THE System SHALL create stock movement records of type "sale" for each line item
6. WHEN a sale is created, THE System SHALL decrease inventory quantities for all sold products
7. THE System SHALL prevent sales if product quantity is insufficient
8. THE System SHALL allow users to add optional notes to sales
9. THE System SHALL record the user who created each sale

### Requirement 7: Dashboard Analytics

**User Story:** As a business owner, I want to view key performance indicators and charts, so that I can understand my business performance at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display total number of active products
2. THE Dashboard SHALL display total current inventory value (sum of quantity × cost price)
3. THE Dashboard SHALL display total sales revenue for the current period
4. THE Dashboard SHALL display count of low stock products
5. THE Dashboard SHALL display a line chart showing sales trends over time
6. THE Dashboard SHALL display a bar chart showing top selling products
7. THE Dashboard SHALL display an area chart showing revenue over time
8. THE Dashboard SHALL use the Talastock color palette (#E8896A, #C1614A, #F2C4B0) for all charts
9. WHEN dashboard data changes, THE System SHALL update metrics and charts in real-time

### Requirement 8: Real-Time Updates

**User Story:** As a business owner, I want to see inventory changes immediately, so that I always have current information when multiple users are working.

#### Acceptance Criteria

1. WHEN inventory quantity changes, THE System SHALL broadcast the update to all connected clients
2. WHEN a new product is created, THE System SHALL update the product list for all connected clients
3. WHEN a sale is recorded, THE System SHALL update dashboard metrics for all connected clients
4. THE System SHALL use Supabase realtime subscriptions for inventory table changes
5. THE System SHALL handle connection interruptions gracefully and reconnect automatically

### Requirement 9: PDF Report Export

**User Story:** As a business owner, I want to export sales and inventory reports as PDF, so that I can share them with stakeholders or keep physical records.

#### Acceptance Criteria

1. THE System SHALL allow users to export sales reports as PDF documents
2. THE System SHALL allow users to export inventory reports as PDF documents
3. WHEN generating a sales report, THE System SHALL include date range, total revenue, and itemized sales list
4. WHEN generating an inventory report, THE System SHALL include product name, SKU, quantity, and value
5. THE System SHALL format PDF reports with the Talastock branding and color scheme
6. THE System SHALL format currency values in Philippine Peso (₱) in PDF reports
7. THE System SHALL include generation timestamp on all PDF reports

### Requirement 10: User Interface Design

**User Story:** As a business owner, I want a clean and modern interface, so that the system is pleasant and easy to use.

#### Acceptance Criteria

1. THE Frontend SHALL use the Talastock color palette with warm peach/salmon tones
2. THE Frontend SHALL display a sidebar navigation with Dashboard, Products, Inventory, Sales, and Reports sections
3. THE Frontend SHALL be fully responsive and functional on mobile devices
4. THE Frontend SHALL use shadcn/ui components for all UI elements
5. THE Frontend SHALL display empty states with helpful messages when lists are empty
6. THE Frontend SHALL show loading skeletons while data is being fetched
7. THE Frontend SHALL use toast notifications for success and error messages
8. THE Frontend SHALL use lucide-react icons consistently throughout the interface

### Requirement 11: Form Validation

**User Story:** As a business owner, I want the system to validate my input, so that I don't accidentally enter incorrect data.

#### Acceptance Criteria

1. THE System SHALL validate that product names are not empty
2. THE System SHALL validate that SKU values are not empty and are unique
3. THE System SHALL validate that prices and cost prices are non-negative numbers
4. THE System SHALL validate that stock quantities are non-negative integers
5. THE System SHALL validate that email addresses are properly formatted during authentication
6. THE System SHALL display inline error messages next to invalid form fields
7. WHEN form validation fails, THE System SHALL prevent form submission and highlight errors

### Requirement 12: Data Security

**User Story:** As a business owner, I want my data to be secure, so that unauthorized users cannot access or modify my business information.

#### Acceptance Criteria

1. THE Database SHALL enable Row Level Security (RLS) on all tables
2. THE Database SHALL allow authenticated users to read all products, inventory, and sales data
3. THE Database SHALL allow authenticated users to create, update, and delete their own data
4. THE Backend SHALL verify authentication tokens on every API request
5. THE System SHALL never expose the Supabase service key to the frontend
6. THE System SHALL use HTTPS for all API communications in production
7. THE System SHALL sanitize all user inputs to prevent SQL injection attacks

### Requirement 13: Performance Optimization

**User Story:** As a business owner, I want the system to load quickly, so that I can work efficiently without waiting.

#### Acceptance Criteria

1. THE Frontend SHALL use Next.js Server Components for initial page loads where possible
2. THE Frontend SHALL use Client Components only when interactivity is required
3. THE System SHALL paginate product and sales lists with a default page size of 20 items
4. THE System SHALL implement database indexes on frequently queried columns (SKU, category_id, product_id)
5. WHEN fetching products, THE System SHALL include related category and inventory data in a single query
6. THE Frontend SHALL implement optimistic UI updates for common operations
7. THE System SHALL cache static data where appropriate to reduce database queries

### Requirement 14: Error Handling

**User Story:** As a business owner, I want clear error messages when something goes wrong, so that I understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN a database operation fails, THE System SHALL display a user-friendly error message
2. WHEN a network request fails, THE System SHALL display a toast notification with retry option
3. WHEN authentication fails, THE System SHALL display the specific reason (invalid credentials, expired session)
4. THE Backend SHALL return structured error responses with success flag, message, and error code
5. THE System SHALL log all errors to the console in development mode
6. THE System SHALL never expose sensitive error details (stack traces, database errors) to end users
7. WHEN an unexpected error occurs, THE System SHALL display a generic error message and log details for debugging
