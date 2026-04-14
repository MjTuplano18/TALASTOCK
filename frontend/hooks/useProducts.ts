'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getProducts,
  createProduct as createProductQuery,
  updateProduct as updateProductQuery,
  deleteProduct as deleteProductQuery,
} from '@/lib/supabase-queries'
import { getCached, setCached, invalidateCache } from '@/lib/cache'
import type { Product, ProductCreate, ProductUpdate } from '@/types'
import type { ProductCreateWithInventory } from '@/components/forms/ProductForm'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 20
const CACHE_KEY = 'products'

export function useProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>(() => getCached<Product[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(() => !getCached<Product[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchProducts = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<Product[]>(CACHE_KEY)
      if (cached) {
        setAllProducts(cached)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts()
      setCached(CACHE_KEY, data)
      setAllProducts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const products = allProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE))

  async function createProduct(data: ProductCreate | ProductCreateWithInventory, silent = false): Promise<Product | null> {
    try {
      const { initial_quantity, low_stock_threshold, ...productData } = data as ProductCreateWithInventory
      const product = await createProductQuery(productData)

      if ((initial_quantity !== undefined && initial_quantity > 0) || low_stock_threshold !== undefined) {
        const updates: Record<string, number> = {}
        if (initial_quantity !== undefined && initial_quantity > 0) updates.quantity = initial_quantity
        if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold
        if (Object.keys(updates).length > 0) {
          await supabase.from('inventory').update(updates).eq('product_id', product.id)
        }
      }

      const updated = [product, ...allProducts]
      setAllProducts(updated)
      setCached(CACHE_KEY, updated)
      if (!silent) toast.success('Product created')
      return product
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : 'Failed to create product')
      return null
    }
  }

  async function updateProduct(id: string, data: ProductUpdate): Promise<Product | null> {
    const previous = allProducts.find(p => p.id === id)
    const optimistic = allProducts.map(p => (p.id === id ? { ...p, ...data } : p))
    setAllProducts(optimistic)
    setCached(CACHE_KEY, optimistic)
    try {
      const updated = await updateProductQuery(id, data)
      const final = allProducts.map(p => (p.id === id ? updated : p))
      setAllProducts(final)
      setCached(CACHE_KEY, final)
      toast.success('Product updated')
      return updated
    } catch (err) {
      if (previous) {
        const reverted = allProducts.map(p => (p.id === id ? previous : p))
        setAllProducts(reverted)
        setCached(CACHE_KEY, reverted)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to update product')
      return null
    }
  }

  async function deleteProduct(id: string): Promise<boolean> {
    const previous = allProducts.find(p => p.id === id)
    const optimistic = allProducts.filter(p => p.id !== id)
    setAllProducts(optimistic)
    setCached(CACHE_KEY, optimistic)
    try {
      await deleteProductQuery(id)
      toast.success('Product deleted')
      return true
    } catch (err) {
      if (previous) {
        const reverted = [previous, ...allProducts.filter(p => p.id !== id)]
        setAllProducts(reverted)
        setCached(CACHE_KEY, reverted)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to delete product')
      return false
    }
  }

  async function bulkDelete(ids: string[]): Promise<void> {
    const optimistic = allProducts.filter(p => !ids.includes(p.id))
    setAllProducts(optimistic)
    setCached(CACHE_KEY, optimistic)
    try {
      await Promise.all(ids.map(id => deleteProductQuery(id)))
      toast.success(`${ids.length} products deleted`)
    } catch (err) {
      toast.error('Failed to delete some products')
      fetchProducts(true)
    }
  }

  async function bulkChangeCategory(ids: string[], categoryId: string): Promise<void> {
    try {
      await Promise.all(ids.map(id => updateProductQuery(id, { category_id: categoryId })))
      await fetchProducts(true)
      toast.success(`Category updated for ${ids.length} products`)
    } catch (err) {
      toast.error('Failed to update categories')
    }
  }

  return {
    products,
    allProducts,
    loading,
    error,
    page,
    totalPages,
    setPage,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDelete,
    bulkChangeCategory,
    refetch: () => fetchProducts(true),
  }
}
