# Implementation Plan: Talastock Lite POS

## Overview

This implementation plan breaks down the Talastock Lite POS feature into discrete, actionable coding tasks. The POS interface provides a dedicated, fast interface for processing sales transactions with barcode scanner support, real-time inventory updates, and seamless integration with existing sales and inventory systems.

**Implementation Language**: TypeScript (React/Next.js)

**Key Technologies**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase

**Performance Targets**: <100ms product lookup, <50ms cart updates, <500ms sale completion

## Tasks

- [x] 1. Set up navigation and routing infrastructure
  - Add POS navigation item to sidebar with ShoppingCart icon
  - Create POS route at `/app/(dashboard)/pos/page.tsx`
  - Add Quick POS button to dashboard page
  - Create loading state at `/app/(dashboard)/pos/loading.tsx`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement barcode scanner hook
  - [x] 2.1 Create `useBarcodeScanner` custom hook
    - Implement global keyboard event listener
    - Buffer input characters with timestamps
    - Detect rapid input (<50ms between characters) as scanner
    - Trigger callback on Enter key
    - Clear buffer after 100ms idle
    - _Requirements: 3.1, 3.4, 15.3, 15.4_
  
  - [ ]* 2.2 Write unit tests for barcode scanner hook
    - Test rapid input detection vs manual typing
    - Test Enter key triggering callback
    - Test buffer clearing after idle
    - Test scanner works without input focus
    - _Requirements: 3.1, 3.4_

- [x] 3. Build product search component
  - [x] 3.1 Create ProductSearch component
    - Implement debounced search input (150ms delay)
    - Query products by name, SKU, and category
    - Filter by `is_active = true`
    - Limit results to 10 items
    - Display product name, SKU, price, and stock quantity
    - Show stock status indicators (in stock, low stock, out of stock)
    - Handle product selection callback
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 11.5_
  
  - [x] 3.2 Create ProductSearchItem sub-component
    - Display product details in search results
    - Show stock status badge
    - Handle click to add to cart
    - Apply Talastock design system colors
    - _Requirements: 2.5, 5.4_
  
  - [ ]* 3.3 Write unit tests for product search
    - Test debounce delays search by 150ms
    - Test search by name returns correct results
    - Test search by SKU returns exact match
    - Test search respects is_active filter
    - Test search limits results to 10 items
    - Test stock status displays correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 4. Checkpoint - Verify search and scanner functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement cart state management
  - [x] 5.1 Create cart state with session storage persistence
    - Define CartItem interface with product, quantity, unitPrice, subtotal
    - Implement addToCart function (increment if exists, add if new)
    - Implement updateQuantity function
    - Implement removeFromCart function
    - Implement clearCart function
    - Persist cart to session storage on updates
    - Load cart from session storage on mount
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 1.8, 13.5_
  
  - [x] 5.2 Add stock validation logic
    - Check inventory quantity when adding to cart
    - Display warning when cart quantity exceeds inventory
    - Allow sale to proceed despite warnings
    - Mark cart items with stockWarning flag
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ]* 5.3 Write unit tests for cart management
    - Test adding product increments quantity if already in cart
    - Test adding product creates new item if not in cart
    - Test updating quantity to 0 removes item
    - Test removing item clears from cart
    - Test cart total calculates correctly
    - Test subtotal calculates correctly
    - Test stock warnings appear when quantity > inventory
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.5_

- [x] 6. Build cart display component
  - [x] 6.1 Create POSCart component
    - Display cart items with product name, SKU, quantity, unit price, subtotal
    - Implement quantity increment/decrement buttons
    - Implement remove item button
    - Calculate and display cart total
    - Show stock warning indicators for items with insufficient stock
    - Disable complete sale button when cart is empty
    - Disable complete sale button when offline
    - Apply touch-friendly button sizes (44px minimum)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.5, 12.2, 14.2_
  
  - [x] 6.2 Create CartItem sub-component
    - Display individual cart item details
    - Implement quantity controls
    - Show stock warning badge if applicable
    - Handle remove action
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.5_
  
  - [ ]* 6.3 Write unit tests for cart display
    - Test cart displays all item details correctly
    - Test quantity controls update cart state
    - Test remove button removes item
    - Test total calculates correctly
    - Test stock warnings display correctly
    - Test complete sale button disabled when cart empty
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_

- [x] 7. Implement sale transaction processing
  - [x] 7.1 Create sale completion API logic
    - Validate cart is non-empty before submission
    - Create sale record in sales table with total_amount and created_by
    - Create sale_items records for each cart item
    - Decrement inventory quantities for each product
    - Create stock_movements records with type='sale'
    - Use atomic transaction (rollback on any failure)
    - Return sale ID and details on success
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 7.2 Implement completeSale function in POS page
    - Call sale creation API with cart items
    - Handle loading state during processing
    - Clear cart on success
    - Show receipt view on success
    - Display error toast on failure
    - Maintain cart state on failure
    - _Requirements: 6.7, 10.2, 10.3_
  
  - [ ]* 7.3 Write integration tests for sale transaction
    - Test sale record created with correct total_amount
    - Test sale items created for all cart items
    - Test inventory decremented correctly
    - Test stock movements created with type='sale'
    - Test transaction rolls back on failure
    - Test cart cleared after successful sale
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Checkpoint - Verify sale transaction flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Build receipt display component
  - [x] 9.1 Create ReceiptView component
    - Display sale ID and timestamp (formatted as YYYY-MM-DD HH:mm)
    - Display each item with name, quantity, unit price, subtotal
    - Display total amount at bottom
    - Implement print button (trigger browser print dialog)
    - Implement "New Sale" button to clear receipt and start fresh
    - Apply Talastock design system styling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 9.2 Write unit tests for receipt display
    - Test receipt displays all sale details correctly
    - Test date formatted correctly
    - Test items displayed with correct calculations
    - Test total displayed correctly
    - Test print button triggers print dialog
    - Test new sale button clears receipt
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 10. Implement offline detection and handling
  - [x] 10.1 Add offline state detection
    - Listen for online/offline events
    - Update offline state in POS page
    - Display offline banner when connection lost
    - Remove offline banner when connection restored
    - Disable complete sale button when offline
    - Allow cart building when offline
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 10.2 Write unit tests for offline handling
    - Test offline banner displays within 2 seconds of disconnect
    - Test complete sale button disabled when offline
    - Test cart building still works offline
    - Test offline banner removed within 2 seconds of reconnect
    - Test complete sale button re-enabled when online
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Integrate all components in POS page
  - [x] 11.1 Create main POS page layout
    - Implement split-screen layout (search left, cart right)
    - Integrate ProductSearch component
    - Integrate POSCart component
    - Integrate ReceiptView component (conditional)
    - Wire up barcode scanner hook
    - Implement product selection handler
    - Implement cart update handlers
    - Implement sale completion handler
    - Handle barcode scan to product lookup
    - Show error toast for invalid SKU scans
    - _Requirements: 1.1, 1.5, 2.4, 3.2, 3.5, 10.4_
  
  - [x] 11.2 Add authentication and session handling
    - Verify user session before allowing POS access
    - Redirect to login if unauthenticated
    - Display session expired message on session timeout
    - Preserve cart in session storage for recovery after re-auth
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 11.3 Implement error handling and user feedback
    - Display toast for network errors
    - Display toast for validation errors
    - Display toast for stock errors (warnings, not blocking)
    - Display toast for invalid barcode scans
    - Log all errors to console with timestamp
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Add mobile responsiveness
  - [x] 12.1 Implement responsive layout
    - Ensure POS works on devices with minimum width 768px
    - Use touch-friendly button sizes (44px minimum)
    - Make cart scrollable when items exceed viewport
    - Make search results scrollable when exceeding viewport
    - Use responsive font sizes for tablet screens
    - _Requirements: 1.7, 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 12.2 Test mobile responsiveness
    - Test layout on 768px width device
    - Test touch targets are 44px minimum
    - Test scrolling works for cart and search results
    - Test fonts are readable on tablet screens
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 13. Optimize performance
  - [x] 13.1 Add performance optimizations
    - Ensure product search completes in <100ms
    - Ensure cart updates render in <50ms
    - Ensure sale completion completes in <500ms
    - Ensure page load completes in <100ms
    - Verify debounce set to 150ms for search
    - Add memoization for cart total calculation
    - Add memoization for stock warning checks
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 13.2 Verify performance requirements
    - Measure product search response time
    - Measure cart update render time
    - Measure sale completion time
    - Measure page load time
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Dashboard synchronization verification
  - [x] 15.1 Verify POS sales appear in dashboard
    - Test new sale appears in sales list immediately
    - Test dashboard metrics update to reflect new sale
    - Test inventory quantities update in inventory page
    - Test stock movements appear in transactions page
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 15.2 Write integration tests for dashboard sync
    - Test sale appears in sales table after completion
    - Test sale includes all necessary fields
    - Test sale items queryable with product relationships
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- All components follow Talastock design system (warm peach/salmon palette)
- Session storage ensures cart persistence across page refreshes
- Atomic transactions ensure data consistency (no partial sales)
- Performance targets: <100ms search, <50ms cart updates, <500ms sale completion
- Mobile-first responsive design with 768px minimum width support
- Barcode scanner works globally without requiring input focus

## Implementation Priority

Following the user's specified priority order:

1. **Navigation setup** (Task 1) - Sidebar + dashboard button
2. **Basic POS page structure** (Task 11.1) - Layout and component integration
3. **Product search** (Task 3) - Search functionality
4. **Cart management** (Tasks 5, 6) - Cart state and display
5. **Barcode scanner** (Task 2) - Scanner integration
6. **Sale transaction** (Task 7) - Transaction processing
7. **Receipt display** (Task 9) - Receipt view
8. **Error handling and offline** (Tasks 10, 11.3) - Error handling and offline support
9. **Testing and polish** (Tasks 12, 13, 15) - Responsiveness, performance, and verification
