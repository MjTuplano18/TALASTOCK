'use client'

import { useState, useMemo } from 'react'
import { Plus, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductsTable } from '@/components/tables/ProductsTable'
import { ProductsTableMobile } from '@/components/tables/ProductsTableMobile'
import { ProductForm } from '@/components/forms/ProductForm'
import { ProductDrawer } from '@/components/products/ProductDrawer'
import { CsvImport } from '@/components/products/CsvImport'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { RangeInput, type RangeValue } from '@/components/shared/RangeInput'
import { Pagination } from '@/components/shared/Pagination'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useDebounce } from '@/hooks/useDebounce'
import { exportProductsToExcel } from '@/lib/excel'
import { getStockStatus } from '@/types'
import { toast } from 'sonner'
import type { Product, ProductUpdate } from '@/types'
import type { ProductCreateWithInventory } from '@/components/forms/ProductForm'

const PAGE_SIZE = 15

export default function ProductsPage() {
  const { allProducts, loading, createProduct, updateProduct, deleteProduct, bulkDelete, bulkChangeCategory, refetch } = useProducts()
  const { categories, createCategory, refetch: refetchCategories } = useCategories()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priceRange, setPriceRange] = useState<RangeValue>({ min: '', max: '' })
  const [stockRange, setStockRange] = useState<RangeValue>({ min: '', max: '' })

  // Debounce search to reduce re-renders (300ms delay)
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    setPage(1)
    return allProducts.filter(p => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
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
  }, [allProducts, debouncedSearch, categoryFilter, statusFilter, priceRange, stockRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || categoryFilter || statusFilter || priceRange.min || priceRange.max || stockRange.min || stockRange.min

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

  async function handleExport() {
    setExporting(true)
    try {
      exportProductsToExcel(filtered, hasFilters ? 'talastock-products-filtered' : 'talastock-products')
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(products: (ProductCreateWithInventory & { _categoryName?: string })[], categoryNames: string[]) {
    const categoryMap: Record<string, string> = {}
    categories.forEach(c => { categoryMap[c.name.toLowerCase()] = c.id })
    for (const name of categoryNames) {
      const key = name.toLowerCase()
      if (!categoryMap[key]) {
        const created = await createCategory(name)
        if (created) categoryMap[key] = created.id
      }
    }
    let successCount = 0, failCount = 0
    for (const p of products) {
      const { _categoryName, ...productData } = p
      const resolvedCategoryId = _categoryName ? (categoryMap[_categoryName.toLowerCase()] ?? null) : null
      const result = await createProduct({ ...productData, category_id: resolvedCategoryId }, true)
      if (result) successCount++; else failCount++
    }
    if (successCount > 0 && failCount === 0) toast.success(`${successCount} product${successCount > 1 ? 's' : ''} imported successfully`)
    else if (successCount > 0) toast.warning(`${successCount} imported, ${failCount} failed`)
    else toast.error('Import failed')
    await refetchCategories(); await refetch()
  }

  function openEdit(product: Product) {
    setDrawerProduct(null); setEditTarget(product); setFormOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-[#7A3E2E]">Products</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Import</span>
          </button>
          <button onClick={handleExport} disabled={exporting || filtered.length === 0}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors disabled:opacity-40">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export{hasFilters ? ` (${filtered.length})` : ''}</span>
          </button>
          <Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU…" />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} placeholder="All Categories"
          options={categories.map(c => ({ label: c.name, value: c.id }))} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="All Status"
          options={[
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock', value: 'low_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
          ]} />
        <div className="hidden sm:block">
          <RangeInput value={priceRange} onChange={setPriceRange} label="Price Range" prefix="₱" placeholder="Price" />
        </div>
        <div className="hidden sm:block">
          <RangeInput value={stockRange} onChange={setStockRange} label="Stock Range" placeholder="Stock qty" />
        </div>
        {hasFilters && <button onClick={clearFilters} className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline sm:ml-auto">Clear filters</button>}
        <span className="text-xs text-[#B89080] sm:ml-auto">{filtered.length} of {allProducts.length} products</span>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#F2C4B0]">
                {['', '', 'Product Name', 'SKU', 'Category', 'Stock', 'Price', 'Status', ''].map((h, i) => (
                  <th key={i} className="text-left py-3 px-3 text-[#B89080] font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody><TableSkeleton rows={PAGE_SIZE} cols={9} /></tbody>
            </table>
          </div>
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
          <>
            {/* Desktop table view */}
            <div className="hidden md:block">
              <ProductsTable products={paginated} categories={categories} loading={false}
                onEdit={openEdit} onDelete={deleteProduct} onRowClick={setDrawerProduct}
                onBulkDelete={bulkDelete} onBulkChangeCategory={bulkChangeCategory} />
            </div>
            
            {/* Mobile card view */}
            <div className="md:hidden">
              <ProductsTableMobile
                products={paginated}
                onEdit={openEdit}
                onDelete={deleteProduct}
                onRowClick={setDrawerProduct}
              />
            </div>
            
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <ProductForm open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) setEditTarget(null) }}
        product={editTarget} onSubmit={handleSubmit} loading={formLoading} />
      <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} onEdit={openEdit} />
      <CsvImport open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  )
}
