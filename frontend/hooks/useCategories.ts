'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getCategories,
  createCategory as createCategoryQuery,
  updateCategory as updateCategoryQuery,
  deleteCategory as deleteCategoryQuery,
} from '@/lib/supabase-queries'
import { getCached, setCached } from '@/lib/cache'
import type { Category } from '@/types'

const CACHE_KEY = 'categories'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => getCached<Category[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(() => !getCached<Category[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<Category[]>(CACHE_KEY)
      if (cached) { setCategories(cached); setLoading(false); return }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCached(CACHE_KEY, data)
      setCategories(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])


  async function createCategory(name: string): Promise<Category | null> {
    try {
      const category = await createCategoryQuery(name)
      const updated = [...categories, category].sort((a, b) => a.name.localeCompare(b.name))
      setCategories(updated)
      setCached(CACHE_KEY, updated)
      toast.success('Category created')
      return category
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category')
      return null
    }
  }

  async function updateCategory(id: string, name: string): Promise<Category | null> {
    try {
      const updated = await updateCategoryQuery(id, name)
      // Force refetch to get the latest data from database
      await fetchCategories(true)
      toast.success('Category updated')
      return updated
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category')
      return null
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      await deleteCategoryQuery(id)
      const list = categories.filter(c => c.id !== id)
      setCategories(list)
      setCached(CACHE_KEY, list)
      toast.success('Category deleted')
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
      return false
    }
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: () => fetchCategories(true),
  }
}
