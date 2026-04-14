# UI Components

## Design System
Talastock uses a warm peach/salmon palette built on top of shadcn/ui + Tailwind CSS.
Every UI decision should feel warm, clean, and professional.

## Brand Colors
```css
--ts-bg:           #FDF6F0   /* page background */
--ts-surface:      #FFFFFF   /* cards, sidebar */
--ts-soft:         #FDE8DF   /* icon bg, active states */
--ts-border:       #F2C4B0   /* all borders */
--ts-accent:       #E8896A   /* primary buttons, highlights */
--ts-accent-dark:  #C1614A   /* hover states, headings */
--ts-text:         #7A3E2E   /* primary text */
--ts-muted:        #B89080   /* labels, secondary text */
--ts-danger-soft:  #FDECEA   /* low stock bg */
--ts-danger:       #C05050   /* low stock, error text */
```

## Tailwind Custom Classes
Add to `tailwind.config.ts`:
```typescript
extend: {
  colors: {
    ts: {
      bg: '#FDF6F0',
      surface: '#FFFFFF',
      soft: '#FDE8DF',
      border: '#F2C4B0',
      accent: '#E8896A',
      'accent-dark': '#C1614A',
      text: '#7A3E2E',
      muted: '#B89080',
    }
  }
}
```

## Component Library
All base components come from shadcn/ui. Install individually as needed:
```bash
npx shadcn-ui@latest add button input dialog select table badge
npx shadcn-ui@latest add card dropdown-menu tooltip popover
```

## Button Variants
```typescript
// Primary — main actions
<Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0">
  Add Product
</Button>

// Secondary — secondary actions
<Button variant="outline" className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]">
  Export PDF
</Button>

// Danger — destructive actions
<Button variant="outline" className="border-[#FDECEA] text-[#C05050] hover:bg-[#FDECEA]">
  Delete
</Button>
```

## Card Component
```typescript
// Standard card used throughout the app
export function TsCard({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-[#F2C4B0] p-5",
      className
    )}>
      {children}
    </div>
  )
}
```

## Metric Card (KPI)
```typescript
// Used on dashboard for key numbers
// Use lucide-react icons, never emoji
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

export function MetricCard({ label, value, sub, icon, danger }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-[#B89080] mb-1">{label}</p>
      <p className={cn("text-2xl font-medium", danger ? "text-[#C05050]" : "text-[#7A3E2E]")}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#B89080] mt-1">{sub}</p>}
    </div>
  )
}

// Usage
<MetricCard 
  label="Total Products" 
  value="1,234" 
  icon={<Package className="w-4 h-4 text-[#E8896A]" />}
/>
```

## Badge / Status Pill
```typescript
// Stock status badges
const statusConfig = {
  in_stock:    { label: 'In stock',    bg: '#FDE8DF', color: '#C1614A' },
  low_stock:   { label: 'Low stock',   bg: '#FDECEA', color: '#C05050' },
  out_of_stock:{ label: 'Out of stock',bg: '#F5E0DF', color: '#A03030' },
}

export function StockBadge({ status }: { status: StockStatus }) {
  const config = statusConfig[status]
  return (
    <span className="text-xs font-medium px-2 py-1 rounded-full"
      style={{ background: config.bg, color: config.color }}>
      {config.label}
    </span>
  )
}
```

## Input Fields
```typescript
// Always use this wrapper for consistent form styling
<Input
  className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
  placeholder="Search products..."
/>
```

## Empty States
Every list/table must have an empty state — never show a blank table:
```typescript
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-4">
        <PackageIcon className="w-6 h-6 text-[#E8896A]" />
      </div>
      <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">{title}</h3>
      <p className="text-xs text-[#B89080] mb-4">{description}</p>
      {action}
    </div>
  )
}
```

## Sidebar Navigation
```typescript
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Inventory', href: '/inventory', icon: Boxes },
  { label: 'Sales', href: '/sales', icon: TrendingUp },
  { label: 'Reports', href: '/reports', icon: FileText },
]
```

## Spacing System
- Page padding: `p-6` (24px)
- Card padding: `p-4` or `p-5`
- Section gap: `gap-4` or `gap-6`
- Form field gap: `gap-3`
- Button padding: `px-4 py-2`

## Typography Scale
- Page title: `text-lg font-medium text-[#7A3E2E]`
- Section title: `text-sm font-medium text-[#7A3E2E]`
- Body: `text-sm text-[#7A3E2E]`
- Muted label: `text-xs text-[#B89080]`
- Large number: `text-2xl font-medium text-[#7A3E2E]`

## What NOT to Do
- Never use arbitrary colors outside the Talastock palette
- Never use dark backgrounds — the app is always light
- Never mix shadcn default colors with Talastock custom colors
- Never use font-bold (700) — use font-medium (500) as the max weight
- Never use more than 2 font sizes in a single card
