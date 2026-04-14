'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardMetrics, TopProductData, Sale } from '@/types'

interface AiInsightCardProps {
  metrics: DashboardMetrics
  topProducts: TopProductData[]
  recentSales: Sale[]
  loading?: boolean
}

export function AiInsightCard({ metrics, topProducts, recentSales, loading }: AiInsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)

  async function fetchInsight() {
    if (loading || !metrics.total_products) return
    setFetching(true)
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          metrics,
          topProducts,
          recentSales,
          lowStockCount: metrics.low_stock_count,
        }),
      })
      const data = await res.json()
      if (data.error === 'AI not configured') {
        setConfigured(false)
      } else {
        setInsight(data.insight)
      }
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!loading && metrics.total_products > 0) {
      fetchInsight()
    }
  }, [loading])

  // Don't render if AI not configured
  if (!configured) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#FDE8DF] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[#E8896A]" />
          </div>
          <span className="text-xs font-medium text-[#7A3E2E]">AI Insight</span>
        </div>
        <button
          onClick={fetchInsight}
          disabled={fetching || loading}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Refresh insight"
        >
          <RefreshCw className={cn('w-3 h-3', fetching && 'animate-spin')} />
        </button>
      </div>

      {fetching || loading ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-full" />
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-4/5" />
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-3/5" />
        </div>
      ) : insight ? (
        <p className="text-xs text-[#7A3E2E] leading-relaxed">{insight}</p>
      ) : (
        <p className="text-xs text-[#B89080]">Add more sales data to get AI insights.</p>
      )}
    </div>
  )
}
