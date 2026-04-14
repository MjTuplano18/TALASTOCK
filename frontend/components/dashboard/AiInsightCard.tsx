'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, AI_TTL } from '@/lib/ai-cache'
import type { DashboardMetrics, TopProductData, Sale, SalesChartData } from '@/types'

// Stable cache key — not tied to metric values so it survives remounts
const CACHE_KEY = 'talastock:ai:insight'

interface AiInsightCardProps {
  metrics: DashboardMetrics
  topProducts: TopProductData[]
  recentSales: Sale[]
  salesChart?: SalesChartData[]
  loading?: boolean
}

export function AiInsightCard({ metrics, topProducts, recentSales, salesChart, loading }: AiInsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Restore from localStorage on mount — this is why it persists across navigation
  useEffect(() => {
    const cached = getAICached(CACHE_KEY)
    if (cached) setInsight(cached)
  }, [])

  async function fetchInsight() {
    setFetching(true)
    setError(null)
    try {
      // Check localStorage cache first — no API call if still fresh
      const cached = getAICached(CACHE_KEY)
      if (cached) { setInsight(cached); setFetching(false); return }

      const res = await aiPost({
        type: 'dashboard_insight',
        metrics,
        topProducts,
        recentSales,
        salesChart,
      })
      const data = await res.json()
      if (res.status === 401) { setError('Please log in to use AI features.'); return }
      if (res.status === 429) { setError(data.error); return }
      if (data.error === 'AI not configured') { setConfigured(false); return }
      if (data.insight) {
        setAICached(CACHE_KEY, data.insight, AI_TTL.INSIGHT)
        setInsight(data.insight)
      }
    } catch {
      setError('Unable to reach AI service.')
    } finally {
      setFetching(false)
    }
  }

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

      {fetching ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-full" />
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-4/5" />
          <div className="h-2.5 bg-[#FDE8DF] rounded animate-pulse w-3/5" />
        </div>
      ) : error ? (
        <p className="text-xs text-[#C05050]">{error}</p>
      ) : insight ? (
        <p className="text-xs text-[#7A3E2E] leading-relaxed">{insight}</p>
      ) : (
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors disabled:opacity-40"
        >
          Click to generate insight →
        </button>
      )}
    </div>
  )
}
