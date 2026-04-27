# Credit Management UI Design Reference

## 1. Collapsible Sidebar Navigation

### Desktop View (Expanded)
```
┌─────────────────────────┐
│   [Talastock Logo]      │
├─────────────────────────┤
│ 🏠 Dashboard            │
│ 📦 Products             │
│ 🏷️  Categories          │
│ 📊 Inventory            │
│ 🛒 POS                  │
│ 📈 Sales                │
│ 🧾 Transactions         │
│ 📄 Reports              │
│                         │
│ 💳 Credit          [3]  │ ← Collapsible group with badge
│   👥 Customers          │ ← Sub-items (indented)
│   📝 Credit Sales       │
│   💰 Payments           │
├─────────────────────────┤
│ 🚪 Sign out             │
└─────────────────────────┘
```

### Desktop View (Collapsed)
```
┌────┐
│ 🏠 │
│ 📦 │
│ 🏷️ │
│ 📊 │
│ 🛒 │
│ 📈 │
│ 🧾 │
│ 📄 │
│    │
│ 💳 │ [3] ← Badge shows on hover
├────┤
│ 🚪 │
└────┘
```

### Mobile View (Drawer)
```
┌─────────────────────────────┐
│   [Talastock Logo]          │
├─────────────────────────────┤
│ 🏠 Dashboard                │
│ 📦 Products                 │
│ 🏷️  Categories              │
│ 📊 Inventory                │
│ 🛒 POS                      │
│ 📈 Sales                    │
│ 🧾 Transactions             │
│ 📄 Reports                  │
│                             │
│ 💳 Credit              [3]  │
│   👥 Customers              │
│   📝 Credit Sales           │
│   💰 Payments               │
├─────────────────────────────┤
│ 🚪 Sign out                 │
└─────────────────────────────┘
```

## 2. Dashboard with Tabs

### Tab Switcher Design
```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
│                                                          │
│ ┌──────────┬──────────┐                                 │
│ │ Overview │  Credit  │  ← Tab buttons                  │
│ └──────────┴──────────┘                                 │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ [Tab content below]                                     │
└──────────────────────────────────────────────────────────┘
```

### Overview Tab (Existing Dashboard)
```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
│ ┌──────────┬──────────┐                                 │
│ │ Overview │  Credit  │                                 │
│ └──────────┴──────────┘                                 │
│                                                          │
│ [Existing dashboard content]                            │
│ - 6 KPI cards                                           │
│ - Sales Trend chart                                     │
│ - Revenue Goal + Top Products                           │
│ - Payment Methods + Category Performance                │
│ - Smart Business Insights                               │
└──────────────────────────────────────────────────────────┘
```

### Credit Tab (New)
```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
│ ┌──────────┬──────────┐                                 │
│ │ Overview │  Credit  │  ← Active tab                   │
│ └──────────┴──────────┘                                 │
│                                                          │
│ [Date Filter: 7d | 30d | 3m | 6m]  [+ Add Customer]    │
│                                                          │
│ ┌─────────────┬─────────────┬─────────────┐            │
│ │ Total Credit│   Overdue   │ Near Limit  │            │
│ │ Outstanding │   Balance   │  Customers  │            │
│ │  ₱125,450   │  ₱18,200    │      3      │            │
│ └─────────────┴─────────────┴─────────────┘            │
│                                                          │
│ ┌─────────────────────────────────────────┐            │
│ │ Overdue Customers                       │            │
│ ├─────────────────────────────────────────┤            │
│ │ Juan Dela Cruz    ₱5,200   12 days  [→]│            │
│ │ Maria Santos      ₱8,500   8 days   [→]│            │
│ │ Pedro Reyes       ₱4,500   5 days   [→]│            │
│ └─────────────────────────────────────────┘            │
│                                                          │
│ ┌──────────────────┬──────────────────────┐            │
│ │ Credit Sales     │ Payment Collection   │            │
│ │ Trend            │ Trend                │            │
│ │ [Line Chart]     │ [Bar Chart]          │            │
│ └──────────────────┴──────────────────────┘            │
└──────────────────────────────────────────────────────────┘
```

## 3. Reports Page with Credit Tabs

### Reports Page Structure
```
┌──────────────────────────────────────────────────────────┐
│ Reports                                                  │
│                                                          │
│ ┌──────────────┬──────────────┐                         │
│ │ Sales Reports│ Credit Reports│  ← Main tabs           │
│ └──────────────┴──────────────┘                         │
│                                                          │
│ [When Credit Reports selected:]                         │
│                                                          │
│ ┌──────────────┬──────────┬──────────────┐             │
│ │ Customer     │  Aging   │   Credit     │             │
│ │ Statement    │  Report  │   Summary    │ ← Sub-tabs  │
│ └──────────────┴──────────┴──────────────┘             │
│                                                          │
│ [Report content below]                                  │
└──────────────────────────────────────────────────────────┘
```

## 4. Color Scheme (Talastock Design System)

### Navigation Colors
- **Active item background**: `#FDE8DF` (ts-soft)
- **Active item text**: `#C1614A` (ts-accent-dark)
- **Inactive item text**: `#7A3E2E` (ts-text)
- **Hover background**: `#FDF6F0` (ts-bg)
- **Border**: `#F2C4B0` (ts-border)
- **Badge background**: `#C05050` (ts-danger)
- **Badge text**: `#FFFFFF` (white)

### Tab Colors
- **Active tab background**: `#FFFFFF` (white)
- **Active tab border-bottom**: `#E8896A` (ts-accent) - 2px
- **Active tab text**: `#7A3E2E` (ts-text) - font-medium
- **Inactive tab text**: `#B89080` (ts-muted)
- **Inactive tab hover**: `#FDF6F0` (ts-bg)

### Credit Dashboard Colors
- **Metric cards**: Standard MetricCard styling
- **Overdue metric**: Use danger styling (`text-[#C05050]`)
- **Charts**: Use Talastock chart colors (`#E8896A`, `#C1614A`)

## 5. Icons (from lucide-react)

### Navigation Icons
- Credit group: `CreditCard`
- Customers: `Users`
- Credit Sales: `FileText`
- Payments: `Wallet`

### Dashboard Icons
- Total Credit Outstanding: `DollarSign`
- Overdue Balance: `AlertTriangle`
- Customers Near Limit: `TrendingUp`

## 6. Interaction Patterns

### Collapsible Group Behavior
1. **Click on "Credit"** → Expands/collapses sub-items
2. **Smooth animation** → 200ms ease-in-out
3. **Chevron icon** → Rotates 90° when expanded
4. **Badge persists** → Shows overdue count even when collapsed
5. **Active state** → Highlights both group and active sub-item

### Tab Behavior
1. **Click tab** → Switches content with fade transition
2. **URL updates** → `/dashboard?tab=credit` or `/dashboard?tab=overview`
3. **Persists on refresh** → Reads from URL query param
4. **Mobile** → Tabs scroll horizontally if needed
5. **Keyboard navigation** → Arrow keys to switch tabs

### Badge Behavior
1. **Shows count** → Number of overdue customers
2. **Updates real-time** → Via Supabase realtime subscription
3. **Max display** → Shows "9+" if count > 9
4. **Tooltip on hover** → "3 customers overdue"
5. **Danger color** → Red background (#C05050)

## 7. Responsive Breakpoints

### Desktop (lg: 1024px+)
- Full sidebar (224px width)
- Collapsible to 64px
- All tabs visible
- 3-column grid for metric cards

### Tablet (md: 768px - 1023px)
- Collapsed sidebar (64px width)
- Icons only, labels on hover
- Tabs visible
- 2-column grid for metric cards

### Mobile (< 768px)
- Drawer sidebar (256px width)
- Hamburger menu toggle
- Tabs scroll horizontally
- 1-column grid for metric cards

## 8. Accessibility

### Navigation
- `aria-label="Credit management"` on group
- `aria-expanded="true/false"` on collapsible
- `aria-current="page"` on active item
- Keyboard navigation support (Tab, Enter, Space)

### Tabs
- `role="tablist"` on tab container
- `role="tab"` on each tab button
- `role="tabpanel"` on content area
- `aria-selected="true/false"` on tabs
- Keyboard navigation (Arrow keys, Home, End)

### Badge
- `aria-label="3 customers overdue"` for screen readers
- Visually hidden text for context

## 9. Animation Specifications

### Collapsible Group
```css
transition: all 200ms ease-in-out;
```

### Tab Switch
```css
/* Fade out old content */
opacity: 0;
transition: opacity 150ms ease-out;

/* Fade in new content */
opacity: 1;
transition: opacity 150ms ease-in;
```

### Badge Pulse (when count increases)
```css
animation: pulse 500ms ease-in-out;

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## 10. Implementation Notes

### Sidebar Component Updates
- Add `isGroup` and `children` properties to nav items
- Add state management for expanded/collapsed groups
- Add badge rendering logic
- Fetch overdue count from API endpoint

### Dashboard Component Updates
- Add tab state management (useState or URL query param)
- Create separate components for Overview and Credit tabs
- Add tab switcher UI component
- Lazy load Credit tab content for performance

### Reports Component Updates
- Add nested tab structure (main tabs + sub-tabs)
- Share tab component with Dashboard
- Add route handling for deep linking to specific reports

### Performance Considerations
- Lazy load Credit tab components
- Cache overdue customer count (5-minute TTL)
- Use React.memo for tab content components
- Debounce tab switches to prevent rapid re-renders
