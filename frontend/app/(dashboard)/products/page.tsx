'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductsTable } from '@/components/tables/ProductsTable'
import { ProductForm } from '@/components/forms/ProductForm'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { RangeInput, type RangeValue } from '@/components/shared/RangeInput'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { getStockStatus } from '@/types'
import type { Product, ProductUpdate } from '@/types'
import type { ProductCreateWithInventory } from '@/components/forms/ProductForm'

export default function ProductsPage() {
  const { allProducts, loading, createProduct, updateProduct, deleteProduct } = useProducts()
  const { categories } = useCategories()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priceRange, setPriceRange] = useState<RangeValue>({ min: '', max: '' })
  const [stockRange, setStockRange] = useState<RangeValue>({ min: '', max: '' })

  const filtered = useMemo(() => {
    return allProducts.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      }
      if (categoryFilter && p.category_id !== categoryFilter) return false
      if (statusFilter) {
        const status = getStockStatus(p.inventory?.quantity ?? 0, p.inventory?.low_stock_threshold ?? 10)
        if (status !== statusFilter) return false
      }
      if (priceRange.min && p.price < Number(priceRange.min)) return false
      if (priceRange.max && p.price > Number(priceRange.max)) return false
      const qty = p.inventory?.quantity ?? 0
      if (stockRange.min && qty < Number(stockRange.min)) return false
      if (stockRange.max && qty > Number(stockRange.max)) return false
      return true
    })
  }, [allProducts, search, categoryFilter, statusFilter, priceRange, stockRange])

  const hasFilters = search || categoryFilter || statusFilter || priceRange.min || priceRange.max || stockRange.min || stockRange.max

  function clearFilters() {
    setSearch(''); setCategoryFilter(''); setStatusFilter('')
    setPriceRange({ min: '', max: '' }); setStockRange({ min: '', max: '' })
  }

  async function handleSubmit(data: ProductCreateWithInventory | ProductUpdate) {
    setFormLoading(true)
    if (editTarget) await updateProduct(editTarget.id, data as ProductUpdate)
    else await createProduct(data as ProductCreateWithInventory)
    setFormLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-[#7A3E2E]">Products</h1>
        <Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4 mr-1" />Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU…" />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter}
          placeholder="All Categories"
          options={categories.map(c => ({ label: c.name, value: c.id }))} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock', value: 'low_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
          ]} />
        <RangeInput value={priceRange} onChange={setPriceRange}
          label="Price Range" prefix="₱" placeholder="Price" />
        <RangeInput value={stockRange} onChange={setStockRange}
          label="Stock Range" placeholder="Stock qty" />
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-[#B89080] ml-auto">
          {filtered.length} of {allProducts.length} products
        </span>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                {['Product Name', 'SKU', 'Category', 'Stock', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[#B89080] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody><TableSkeleton rows={5} cols={7} /></tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No products match your filters' : 'No products yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Add your first product to get started.'}
            action={!hasFilters ? (
              <Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
                onClick={() => { setEditTarget(null); setFormOpen(true) }}>
                <Plus className="w-4 h-4 mr-1" />Add Product
              </Button>
            ) : undefined}
          />
        ) : (
          <ProductsTable products={filtered} loading={false}
            onEdit={p => { setEditTarget(p); setFormOpen(true) }}
            onDelete={deleteProduct} />
        )}
      </div>

      <ProductForm
        open={formOpen}
        onOpenChange={open => { setFormOpen(open); if (!open) setEditTarget(null) }}
        product={editTarget}
        onSubmit={handleSubmit}
        loading={formLoading}
      />
    </div>
  )
}
