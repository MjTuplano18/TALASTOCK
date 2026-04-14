# React Component Patterns

## Component Architecture
Talastock uses a 3-layer component architecture:

```
pages (app/)           → route-level, data fetching, layout
  └── features/        → feature-specific smart components
        └── ui/        → dumb, reusable presentational components
```

## Server vs Client Components
Default to Server Components. Only use Client Components when you need:
- useState or useEffect
- Browser APIs (localStorage, window)
- Event listeners
- Third-party client libraries (shadcn/ui Charts)

```typescript
// ✅ Server Component (default) — no 'use client'
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: products } = await supabase.from('products').select('*')
  return <DashboardView products={products} />
}

// ✅ Client Component — only when needed
// components/charts/SalesChart.tsx
'use client'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
```

## Page Layout Pattern
```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FDF6F0]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

## Data Table Pattern
```typescript
// All data tables use TanStack Table
// components/tables/ProductsTable.tsx
'use client'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

export function ProductsTable({ data }: { data: Product[] }) {
  const columns = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'stock_quantity', header: 'Stock' },
    { accessorKey: 'price', header: 'Price',
      cell: ({ row }) => `₱${row.original.price.toLocaleString()}` },
  ]

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <table className="w-full text-sm">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id} className="border-b border-[#F2C4B0]">
            {headerGroup.headers.map(header => (
              <th key={header.id} className="text-left py-3 text-[#B89080] font-medium">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
            {row.getVisibleCells().map(cell => (
              <td key={cell.id} className="py-3 text-[#7A3E2E]">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Modal / Dialog Pattern
```typescript
// Always use shadcn Dialog — never build custom modals
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AddProductModal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-[#F2C4B0]">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Add Product</DialogTitle>
        </DialogHeader>
        <ProductForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
```

## Form Pattern
```typescript
// Always use React Hook Form + Zod for validation
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock_quantity: z.number().min(0),
})

export function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema)
  })
  // ...
}
```

## Loading States
- Use `loading.tsx` for route-level loading
- Use skeleton components for content loading
- Never show a blank page while loading

## Toast Notifications
```typescript
// Always use sonner for toasts
import { toast } from 'sonner'

toast.success('Product added successfully')
toast.error('Failed to add product')
toast.warning('Stock is running low')
```

## What NOT to Do
- Never use `index.tsx` for named components — use the component name
- Never put business logic directly in JSX
- Never use inline styles — Tailwind only
- Never use `document.getElementById` — use refs
