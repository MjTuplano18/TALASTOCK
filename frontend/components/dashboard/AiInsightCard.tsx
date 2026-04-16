'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, clearAICacheKey, AI_TTL } from '@/lib/ai-cache'
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

  // Auto-fetch on mount if no cache
  useEffect(() => {
    if (!loading && !insight && !error) {
      fetchInsight(false)
    }
  }, [loading])

  async function fetchInsight(forceRefresh = false) {
    setFetching(true)
    setError(null)
    try {
      // If force refresh, clear cache first
      if (forceRefresh) {
        clearAICacheKey(CACHE_KEY)
      } else {
        // Check localStorage cache first — no API call if still fresh
        const cached = getAICached(CACHE_KEY)
        if (cached) { setInsight(cached); setFetching(false); return }
      }

      const res = await aiPost({
        type: 'dashboard_insight',
        metrics,
        topProducts,
        recentSales,
        salesChart,
      })
      const data = await res.json()
      if (res.status === 401) { setError('Please log in to use AI features.'); setFetching(false); return }
      if (res.status === 429) { setError(data.error); setFetching(false); return }
      if (data.error === 'AI not configured') { setConfigured(false); setFetching(false); return }
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

  function handleRefresh() {
    fetchInsight(true) // Force refresh, bypass cache
  }

  if (!configured) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-5 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#7A3E2E]">AI Insight</span>
            <span className="text-xs text-[#B89080]">Business intelligence</span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={fetching || loading}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Refresh insight"
        >
          <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {fetching ? (
          <div className="flex flex-col gap-2 w-full">
            <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-full" />
            <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-5/6" />
            <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-4/6" />
            <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-5/6" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#C05050] mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors"
            >
              Try again →
            </button>
          </div>
        ) : insight ? (
          <div className="w-full">
            <p className="text-sm text-[#7A3E2E] leading-relaxed">{insight}</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-[#E8896A]" />
            </div>
            <p className="text-sm text-[#7A3E2E] font-medium mb-1">Generating insights...</p>
            <button
              onClick={() => fetchInsight(false)}
              disabled={loading}
              className="text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors disabled:opacity-40"
            >
              Click to generate →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
