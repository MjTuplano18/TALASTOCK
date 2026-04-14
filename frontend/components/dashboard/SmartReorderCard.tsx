'use client'

import { useState } from 'react'
import { Package, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import type { InventoryItem, TopProductData, SalesChartData } from '@/types'

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

  async function fetchSuggestions() {
    if (loading || lowStockItems.length === 0) return
    setFetching(true)
    try {
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
      setSuggestions(data.suggestions ?? [])
      setFetched(true)
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  // No auto-fetch on load — user must click (per ai-security.md)

  if (!configured) return null
  if (!loading && lowStockItems.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-[#E8896A]" />
          </div>
          <span className="text-xs font-medium text-[#7A3E2E]">Smart Reorder Suggestions</span>
          <span className="text-[10px] bg-[#FDECEA] text-[#C05050] px-1.5 py-0.5 rounded-full font-medium">
            {lowStockItems.length} items low
          </span>
        </div>
        <button onClick={fetchSuggestions} disabled={fetching || loading}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Refresh suggestions">
          <RefreshCw className={cn('w-3 h-3', fetching && 'animate-spin')} />
        </button>
      </div>

      {fetching || loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 bg-[#FDE8DF] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-[#FDF6F0] border border-[#F2C4B0] rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertTriangle className="w-3 h-3 text-[#C05050] shrink-0" />
                    <span className="text-xs font-medium text-[#7A3E2E] truncate">{s.product}</span>
                  </div>
                  <p className="text-[10px] text-[#B89080] leading-relaxed">{s.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#B89080]">Current</p>
                  <p className="text-sm font-medium text-[#C05050]">{s.current}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#B89080]">Order</p>
                  <p className="text-sm font-medium text-[#C1614A]">{s.suggested_order}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : fetched ? (
        <p className="text-xs text-[#B89080]">No specific reorder suggestions at this time.</p>
      ) : (
        <p className="text-xs text-[#B89080]">Click refresh to generate reorder suggestions.</p>
      )}
    </div>
  )
}
