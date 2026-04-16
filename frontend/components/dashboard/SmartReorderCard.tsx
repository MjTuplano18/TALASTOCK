'use client'

import { useState, useEffect } from 'react'
import { Package, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, clearAICacheKey, AI_TTL } from '@/lib/ai-cache'
import type { InventoryItem, TopProductData, SalesChartData } from '@/types'

const CACHE_KEY = 'talastock:ai:reorder'

interface Suggestion {
  product: string
  current: number
  suggested_order: number
  reason: string
}

interface SmartReorderCardProps {
  inventory: InventoryItem[]
  salesChart: SalesChartData[]
  topProducts: TopProductData[]
  loading?: boolean
}

export function SmartReorderCard({ inventory, salesChart, topProducts, loading }: SmartReorderCardProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [fetched, setFetched] = useState(false)

  const lowStockItems = inventory.filter(i => i.quantity <= i.low_stock_threshold)

  // Restore from cache on mount
  useEffect(() => {
    const cached = getAICached(CACHE_KEY)
    if (cached) {
      try {
        setSuggestions(JSON.parse(cached))
        setFetched(true)
      } catch {}
    }
  }, [])

  // Auto-fetch on mount if no cache and has low stock items
  useEffect(() => {
    if (!loading && !fetched && lowStockItems.length > 0) {
      fetchSuggestions(false)
    }
  }, [loading, lowStockItems.length])

  function handleRefresh() {
    fetchSuggestions(true) // Force refresh, bypass cache
  }

  async function fetchSuggestions(forceRefresh = false) {
    if (loading || lowStockItems.length === 0) return
    setFetching(true)
    try {
      // If force refresh, clear cache first
      if (forceRefresh) {
        clearAICacheKey(CACHE_KEY)
      } else {
        // Check cache first
        const cached = getAICached(CACHE_KEY)
        if (cached) {
          try {
            setSuggestions(JSON.parse(cached))
            setFetched(true)
            setFetching(false)
            return
          } catch {}
        }
      }

      const res = await aiPost({
        type: 'reorder_suggestions',
        inventory: lowStockItems.map(i => ({
          product: i.products?.name ?? i.product_id,
          sku: i.products?.sku ?? '',
          quantity: i.quantity,
          threshold: i.low_stock_threshold,
        })),
        salesChart,
        topProducts,
      })
      const data = await res.json()
      if (data.error === 'AI not configured') { setConfigured(false); return }
      const result = data.suggestions ?? []
      setAICached(CACHE_KEY, JSON.stringify(result), AI_TTL.REORDER)
      setSuggestions(result)
      setFetched(true)
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  if (!configured) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-5 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Package className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#7A3E2E]">Smart Reorder Suggestions</span>
            <span className="text-xs text-[#B89080]">AI-powered restocking</span>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={fetching || loading || lowStockItems.length === 0}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Refresh suggestions">
          <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
        </button>
      </div>

      {lowStockItems.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-[#E8896A]" />
          </div>
          <p className="text-sm text-[#7A3E2E] font-medium mb-1">All stock levels healthy!</p>
          <p className="text-xs text-[#B89080]">No items need restocking at this time</p>
        </div>
      ) : (
        <>
          {lowStockItems.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-[#FDECEA] border border-[#F2C4B0] rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
                <span className="text-xs text-[#C05050] font-medium">
                  {lowStockItems.length} {lowStockItems.length === 1 ? 'item needs' : 'items need'} restocking
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {fetching || loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[#FDE8DF] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-[#FDF6F0] border border-[#F2C4B0] rounded-xl p-3 hover:bg-[#FDE8DF] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#7A3E2E] truncate">{s.product}</span>
                        </div>
                        <p className="text-xs text-[#B89080] leading-relaxed">{s.reason}</p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-[#B89080] mb-0.5">Current</p>
                          <p className="text-lg font-medium text-[#C05050]">{s.current}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#B89080] mb-0.5">Order</p>
                          <p className="text-lg font-medium text-[#C1614A]">{s.suggested_order}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : fetched ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-[#E8896A]" />
                </div>
                <p className="text-sm text-[#7A3E2E] font-medium mb-1">All good!</p>
                <p className="text-xs text-[#B89080]">No specific reorder suggestions at this time.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-[#E8896A]" />
                </div>
                <p className="text-sm text-[#7A3E2E] font-medium mb-1">Analyzing inventory...</p>
                <p className="text-xs text-[#B89080]">Click refresh to generate suggestions</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
