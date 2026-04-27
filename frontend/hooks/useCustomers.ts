'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast as enhancedToast } from '@/lib/toast'
import {
  getCustomers,
  createCustomer as createCustomerQuery,
  updateCustomer as updateCustomerQuery,
  deleteCustomer as deleteCustomerQuery,
} from '@/lib/supabase-queries'
import { getCached, setCached } from '@/lib/cache'
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types'

const CACHE_KEY = 'customers'

export function useCustomers() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => getCached<Customer[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(() => !getCached<Customer[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<Customer[]>(CACHE_KEY)
      if (cached) {
        setAllCustomers(cached)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers()
      setCached(CACHE_KEY, data)
      setAllCustomers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load customers'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  async function createCustomer(data: CustomerCreate): Promise<Customer | null> {
    try {
      const customer = await createCustomerQuery(data)
      const updated = [customer, ...allCustomers]
      setAllCustomers(updated)
      setCached(CACHE_KEY, updated)
      enhancedToast.success('Customer created')
      return customer
    } catch (err) {
      enhancedToast.error(err instanceof Error ? err.message : 'Failed to create customer')
      return null
    }
  }

  async function updateCustomer(id: string, data: CustomerUpdate): Promise<Customer | null> {
    const previous = allCustomers.find(c => c.id === id)
    const optimistic = allCustomers.map(c => (c.id === id ? { ...c, ...data } : c))
    setAllCustomers(optimistic)
    setCached(CACHE_KEY, optimistic)
    try {
      const updated = await updateCustomerQuery(id, data)
      // Force refetch to get the latest data from database
      await fetchCustomers(true)
      enhancedToast.success('Customer updated')
      return updated
    } catch (err) {
      if (previous) {
        const reverted = allCustomers.map(c => (c.id === id ? previous : c))
        setAllCustomers(reverted)
        setCached(CACHE_KEY, reverted)
      }
      enhancedToast.error(err instanceof Error ? err.message : 'Failed to update customer')
      return null
    }
  }

  async function deleteCustomer(id: string): Promise<boolean> {
    const previous = allCustomers.find(c => c.id === id)
    if (!previous) return false

    // Optimistically remove from UI
    const optimistic = allCustomers.filter(c => c.id !== id)
    setAllCustomers(optimistic)
    setCached(CACHE_KEY, optimistic)

    // Track if deletion was undone
    let undone = false

    // Show toast with undo option (5 seconds to undo)
    enhancedToast.success(`${previous.name} deleted`, {
      duration: 5000,
      onUndo: () => {
        undone = true
        // Restore the customer immediately
        const restored = [previous, ...allCustomers.filter(c => c.id !== id)]
        setAllCustomers(restored)
        setCached(CACHE_KEY, restored)
        enhancedToast.success('Customer restored')
      },
    })

    // Wait for the toast duration, then actually delete if not undone
    setTimeout(async () => {
      if (!undone) {
        try {
          await deleteCustomerQuery(id)
        } catch (err) {
          // If deletion fails, restore the customer
          const reverted = [previous, ...allCustomers.filter(c => c.id !== id)]
          setAllCustomers(reverted)
          setCached(CACHE_KEY, reverted)
          enhancedToast.error(err instanceof Error ? err.message : 'Failed to delete customer')
        }
      }
    }, 5000)

    return true
  }

  return {
    allCustomers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: () => fetchCustomers(true),
  }
}
