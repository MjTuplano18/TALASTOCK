# Supabase Conventions

## Overview
Talastock uses Supabase as the primary database and auth provider.
PostgreSQL under the hood — treat it like a real production database.

## Database Schema
```sql
-- Run in Supabase SQL editor in this exact order

-- 1. Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- 2. Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2) not null default 0,
  cost_price numeric(10,2) not null default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Inventory
create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade unique,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 10,
  updated_at timestamptz default now()
);

-- 4. Stock Movements
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  type text check (type in ('restock', 'sale', 'adjustment', 'return')),
  quantity integer not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 5. Sales
create table sales (
  id uuid primary key default gen_random_uuid(),
  total_amount numeric(10,2) not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 6. Sale Items
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) generated always as (quantity * unit_price) stored
);
```

## Row Level Security (RLS)
Always enable RLS on every table. Never disable it.

```sql
-- Enable RLS
alter table products enable row level security;
alter table inventory enable row level security;
alter table sales enable row level security;

-- Policy: authenticated users can read all
create policy "Authenticated can read products"
  on products for select
  to authenticated
  using (true);

-- Policy: authenticated users can insert/update
create policy "Authenticated can modify products"
  on products for all
  to authenticated
  using (true);
```

## Query Patterns (Frontend)
```typescript
// lib/supabase-queries.ts

// Fetch products with category
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), inventory(quantity, low_stock_threshold)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Fetch low stock products
export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*, products(name, sku)')
    .filter('quantity', 'lte', 'low_stock_threshold')

  if (error) throw new Error(error.message)
  return data
}

// Record a sale with items (use transaction)
export async function recordSale(sale: SaleInput) {
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({ total_amount: sale.total, notes: sale.notes })
    .select()
    .single()

  if (saleError) throw new Error(saleError.message)

  const items = sale.items.map(item => ({
    sale_id: saleData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('sale_items').insert(items)
  if (itemsError) throw new Error(itemsError.message)

  return saleData
}
```

## Realtime Subscriptions
Use Supabase realtime for live inventory updates on the dashboard:

```typescript
// hooks/useRealtimeInventory.ts
useEffect(() => {
  const channel = supabase
    .channel('inventory-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'inventory'
    }, (payload) => {
      setInventory(prev => updateInventoryItem(prev, payload))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

## Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key  # Never expose this to frontend
```

## What NOT to Do
- Never use the service key on the frontend — anon key only
- Never disable RLS — use policies instead
- Never run migrations manually without testing locally first
- Never store images in the database — use Supabase Storage
- Never fetch all columns with `select('*')` on large tables — be specific
