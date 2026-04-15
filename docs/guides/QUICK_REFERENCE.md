# Quick Reference Guide

## 🚀 Quick Start

### Using Enhanced Toasts
```typescript
import { toast } from '@/lib/toast'

// Success with undo
toast.success('Product deleted', {
  onUndo: () => restoreProduct()
})

// Error with retry
toast.error('Failed to save', {
  action: { label: 'Retry', onClick: () => save() }
})

// Promise toast
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed!'
})
```

### Checking Online Status
```typescript
import { isOnline, getQueueSize } from '@/lib/offline'

if (!isOnline()) {
  console.log('Offline mode')
  console.log(`${getQueueSize()} requests queued`)
}
```

### Using Empty States
```typescript
import { EmptyState } from '@/components/shared/EmptyState'

<EmptyState
  title="No products yet"
  description="Add your first product to get started."
  icon="package"
  tips={[
    "Import from CSV for bulk upload",
    "Use SKU codes for tracking"
  ]}
  action={<Button>Add Product</Button>}
/>
```

---

## 📱 Mobile Components

### Products Mobile View
```typescript
import { ProductsTableMobile } from '@/components/tables/ProductsTableMobile'

<div className="md:hidden">
  <ProductsTableMobile
    products={products}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onRowClick={handleView}
  />
</div>
```

### Inventory Mobile View
```typescript
import { InventoryTableMobile } from '@/components/tables/InventoryTableMobile'

<div className="md:hidden">
  <InventoryTableMobile
    items={inventory}
    onAdjust={handleAdjust}
    onViewHistory={handleHistory}
  />
</div>
```

### Sales Mobile View
```typescript
import { SalesTableMobile } from '@/components/tables/SalesTableMobile'

<div className="md:hidden">
  <SalesTableMobile
    sales={sales}
    onView={handleView}
    onDelete={handleDelete}
  />
</div>
```

---

## ♿ Accessibility

### ARIA Labels
```typescript
// Button with label
<button aria-label="Delete product">
  <Trash2 className="w-4 h-4" aria-hidden="true" />
</button>

// Navigation
<nav aria-label="Main navigation">
  <Link href="/dashboard" aria-current="page">
    Dashboard
  </Link>
</nav>

// Search
<div role="search">
  <input type="search" aria-label="Search products" />
</div>
```

### Skip Navigation
```typescript
// Already included in layout
import { SkipNavigation } from '@/components/shared/SkipNavigation'

<SkipNavigation />
<main id="main-content">
  {children}
</main>
```

---

## 🔌 Offline Support

### Queue a Request
```typescript
import { queueRequest } from '@/lib/offline'

if (!navigator.onLine) {
  queueRequest('/api/products', 'POST', { name: 'Product' })
  toast.info('Request queued. Will sync when online.')
}
```

### Process Queue Manually
```typescript
import { processQueue } from '@/lib/offline'

const result = await processQueue()
console.log(`Synced: ${result.success}, Failed: ${result.failed}`)
```

### Clear Queue
```typescript
import { clearQueue } from '@/lib/offline'

clearQueue()
toast.success('Queue cleared')
```

---

## 🎨 Styling

### Talastock Colors
```css
--ts-bg: #FDF6F0           /* Page background */
--ts-surface: #FFFFFF      /* Cards, sidebar */
--ts-soft: #FDE8DF         /* Icon bg, active states */
--ts-border: #F2C4B0       /* Borders */
--ts-accent: #E8896A       /* Primary buttons */
--ts-accent-dark: #C1614A  /* Hover states */
--ts-text: #7A3E2E         /* Primary text */
--ts-muted: #B89080        /* Secondary text */
--ts-danger: #C05050       /* Error, low stock */
```

### Responsive Breakpoints
```css
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Common Patterns
```typescript
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile only</div>

// Responsive grid
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

// Responsive padding
<div className="p-3 sm:p-4 md:p-6">

// Responsive text
<p className="text-sm sm:text-base lg:text-lg">
```

---

## 🧪 Testing

### Test Offline Mode
```
1. Open DevTools (F12)
2. Network tab → Throttling → Offline
3. Make a change
4. See offline indicator
5. Go back online
6. See sync notification
```

### Test Service Worker
```
1. Open DevTools (F12)
2. Application tab → Service Workers
3. See "talastock-v1" registered
4. Check "Offline" checkbox
5. Reload page
6. App still works
```

### Test Accessibility
```
1. Tab through all elements
2. Check focus indicators
3. Use screen reader (NVDA/VoiceOver)
4. Check color contrast
5. Test keyboard navigation
```

### Test Mobile
```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro"
4. Test touch interactions
5. Check card views
6. Test hamburger menu
```

---

## 🐛 Troubleshooting

### Service Worker Issues
```typescript
// Unregister service worker
import { unregisterServiceWorker } from '@/lib/service-worker'
await unregisterServiceWorker()

// Clear all caches
import { clearAllCaches } from '@/lib/service-worker'
await clearAllCaches()

// Hard reload
window.location.reload()
```

### Toast Not Showing
```typescript
// Check Toaster is in layout
// frontend/app/layout.tsx
<Toaster position="bottom-right" />

// Import from correct location
import { toast } from '@/lib/toast'  // ✅ Enhanced
import { toast } from 'sonner'       // ❌ Basic
```

### Offline Indicator Not Showing
```typescript
// Check if component is mounted
// frontend/app/(dashboard)/layout.tsx
<OfflineIndicator />

// Check browser support
console.log('Online:', navigator.onLine)
console.log('SW:', 'serviceWorker' in navigator)
```

---

## 📚 Documentation

### Full Documentation
- `IMPROVEMENTS.md` - Security & performance
- `MOBILE_RESPONSIVE_IMPROVEMENTS.md` - Mobile features
- `ACCESSIBILITY_AND_UX_IMPROVEMENTS.md` - Accessibility
- `TOAST_AND_OFFLINE_IMPROVEMENTS.md` - Toast & offline
- `FINAL_IMPROVEMENTS_SUMMARY.md` - Complete summary

### Quick Summaries
- `FIXES_SUMMARY.md` - Security fixes
- `MOBILE_IMPROVEMENTS_SUMMARY.md` - Mobile summary
- `ALL_IMPROVEMENTS_COMPLETE.md` - Feature list
- `QUICK_REFERENCE.md` - This file

---

## 🔗 Useful Links

### Development
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Supabase: https://supabase.com/docs

### Accessibility
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA: https://www.w3.org/WAI/ARIA/apg/

### Testing
- Lighthouse: Chrome DevTools
- axe DevTools: Browser extension
- WAVE: https://wave.webaim.org/

---

## 💡 Pro Tips

### Performance
- Use `loading.tsx` for route-level loading
- Implement debouncing for search (300ms)
- Cache API responses (5-30 minutes)
- Use service worker for static assets

### Accessibility
- Always add `aria-label` to icon-only buttons
- Use semantic HTML (`nav`, `main`, `aside`)
- Ensure 4.5:1 contrast ratio for text
- Test with keyboard navigation

### Mobile
- Design mobile-first, enhance for desktop
- Use 44x44px minimum tap targets
- Test on real devices
- Consider one-handed use

### Offline
- Queue write operations only
- Show clear feedback to users
- Limit queue size (max 100)
- Auto-sync when back online

---

## 🎯 Common Tasks

### Add a New Page
```typescript
// 1. Create page
// frontend/app/(dashboard)/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}

// 2. Add to sidebar
// frontend/components/layout/Sidebar.tsx
const navItems = [
  // ...
  { label: 'New Page', href: '/new-page', icon: Icon },
]

// 3. Add loading state
// frontend/app/(dashboard)/new-page/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### Add a New Toast Type
```typescript
// frontend/lib/toast.tsx
export function custom(message: string, options?: EnhancedToastOptions) {
  return sonnerToast(message, {
    icon: <YourIcon className="w-4 h-4" />,
    ...options,
  })
}

// Usage
toast.custom('Custom message')
```

### Add a New Empty State Icon
```typescript
// frontend/components/shared/EmptyState.tsx
const icons = {
  // ...
  newIcon: NewIcon,
}

// Usage
<EmptyState icon="newIcon" ... />
```

---

**Last Updated:** April 14, 2026
**Version:** 1.0.0
**Status:** Production Ready

