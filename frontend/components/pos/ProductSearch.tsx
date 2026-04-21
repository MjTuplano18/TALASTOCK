'use client'

import { useState, useEffect } from 'react'
import { Search, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency } from '@/lib/utils'
import { getStockStatus, type Product, type StockStatus } from '@/types'

interface ProductSearchProps {
  onProductSelect: (product: Product) => void
  disabled?: boolean
}

interface ProductSearchResult extends Product {
  stockStatus: StockStatus
}

export function ProductSearch({ onProductSelect, disabled }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const debouncedQuery = useDebounce(query, 150)

  // Load all products on mount, then filter based on search
  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      try {
        let queryBuilder = supabase
          .from('products')
          .select('*, categories(name), inventory(quantity, low_stock_threshold)')
          .eq('is_active', true)
          .order('name')

        // If there's a search query, filter by it
        if (debouncedQuery.trim()) {
          const searchTerm = `%${debouncedQuery.toLowerCase()}%`
          queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        }

        const { data, error } = await queryBuilder.limit(50) // Show more products

        if (error) throw error

        // Transform results to include stock status
        const transformedResults: ProductSearchResult[] = (data || []).map(product => ({
          ...product,
          stockStatus: getStockStatus(
            product.inventory?.quantity ?? 0,
            product.inventory?.low_stock_threshold ?? 10
          ),
        }))

        setResults(transformedResults)
      } catch (error) {
        console.error('Product search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [debouncedQuery])

  function handleProductClick(product: ProductSearchResult) {
    if (disabled) return
    onProductSelect(product)
    // Don't clear search - keep showing products for easy multiple selections
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89080]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name or SKU..."
          disabled={disabled}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#F2C4B0] text-sm text-[#7A3E2E] placeholder:text-[#B89080] focus:outline-none focus:ring-2 focus:ring-[#E8896A] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-[#E8896A]" />
            </div>
            <p className="text-sm text-[#7A3E2E] font-medium mb-1">No products found</p>
            <p className="text-xs text-[#B89080]">Try a different search term</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((product) => (
              <ProductSearchItem
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProductSearchItemProps {
  product: ProductSearchResult
  onClick: () => void
  disabled?: boolean
}

function ProductSearchItem({ product, onClick, disabled }: ProductSearchItemProps) {
  const stockQuantity = product.inventory?.quantity ?? 0
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-3 rounded-lg border border-[#F2C4B0] hover:bg-[#FDF6F0] hover:border-[#E8896A] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#7A3E2E] truncate">{product.name}</p>
          <p className="text-xs text-[#B89080] font-mono">{product.sku}</p>
        </div>
        <p className="text-sm font-medium text-[#7A3E2E] shrink-0">{formatCurrency(product.price)}</p>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <StockBadge status={product.stockStatus} quantity={stockQuantity} />
        {product.categories && (
          <span className="text-xs text-[#B89080]">{product.categories.name}</span>
        )}
      </div>
    </button>
  )
}

interface StockBadgeProps {
  status: StockStatus
  quantity: number
}

function StockBadge({ status, quantity }: StockBadgeProps) {
  const config = {
    in_stock: { label: `${quantity} in stock`, bg: '#FDE8DF', color: '#C1614A' },
    low_stock: { label: `${quantity} left`, bg: '#FDECEA', color: '#C05050' },
    out_of_stock: { label: 'Out of stock', bg: '#F5E0DF', color: '#A03030' },
  }

  const { label, bg, color } = config[status]

  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
