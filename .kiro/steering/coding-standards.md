# Coding Standards

## Guiding Philosophy
Write code that a junior developer can read and understand without asking questions.
Clarity beats cleverness every single time.

## TypeScript Rules
- Always define types — never use `any`
- Use `interface` for object shapes, `type` for unions and primitives
- All API response types live in `/types/index.ts`
- Enable strict mode in `tsconfig.json`

```typescript
// ✅ Good
interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock_quantity: number
  category_id: string
  created_at: string
}

// ❌ Bad
const product: any = { ... }
```

## Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ProductTable.tsx` |
| Hooks | camelCase with `use` | `useInventory.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Constants | SCREAMING_SNAKE | `LOW_STOCK_THRESHOLD` |
| DB tables | snake_case | `stock_movements` |
| API routes | kebab-case | `/stock-movements` |

## File Structure Rules
- One component per file — no exceptions
- Keep files under 200 lines — if longer, split it
- Group imports: external → internal → types → styles

```typescript
// ✅ Correct import order
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ProductTable } from '@/components/tables/ProductTable'
import { useProducts } from '@/hooks/useProducts'

import type { Product } from '@/types'
```

## Component Pattern
```typescript
// components/products/ProductCard.tsx
'use client'

import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="rounded-lg border border-[#F2C4B0] bg-white p-4">
      <h3 className="text-sm font-medium text-[#7A3E2E]">{product.name}</h3>
      <p className="text-xs text-[#B89080]">{product.sku}</p>
    </div>
  )
}
```

## Custom Hooks Pattern
```typescript
// hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await api.get('/products')
        setProducts(data)
      } catch (err) {
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return { products, loading, error }
}
```

## Python / FastAPI Rules
- Use Pydantic v2 for all schemas
- One router file per feature domain
- Keep business logic in `/services/`, not in routers
- Always use async functions for DB calls

```python
# ✅ Good — logic in service layer
# routers/products.py
@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(payload: ProductCreate, db=Depends(get_db)):
    return await product_service.create(payload, db)
```

## Error Handling
- Always use try/except in async functions
- Never let unhandled exceptions reach the user
- Frontend: show toast notifications for errors, not alerts

## What NOT to Do
- No magic numbers — use named constants
- No nested ternaries — use if/else or early returns
- No duplicate code — extract to a shared utility
- No TODO comments in committed code — open a GitHub issue instead
- No `console.log` in production — remove before committing
