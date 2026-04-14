'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, AI_TTL } from '@/lib/ai-cache'
import type { DashboardMetrics, TopProductData, Sale, SalesChartData, InventoryItem } from '@/types'

interface AiReportSummaryProps {
  metrics: DashboardMetrics
  topProducts: TopProductData[]
  recentSales: Sale[]
  salesChart: SalesChartData[]
  inventory: InventoryItem[]
  period: string
  onSummaryGenerated?: (summary: string) => void
}

export function AiReportSummary({
  metrics, topProducts, recentSales, salesChart, inventory, period, onSummaryGenerated
}: AiReportSummaryProps) {
  const cacheKey = `report:${period}:${Math.round(metrics.total_sales_revenue / 100)}`

  const [summary, setSummary] = useState<string | null>(() => getAICached(cacheKey))
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setFetching(true)
    try {
      // Check localStorage cache — no API call if still fresh
      const cached = getAICached(cacheKey)
      if (cached) {
        setSummary(cached)
        onSummaryGenerated?.(cached)
        setFetching(false)
        return
      }

      const res = await aiPost({
        type: 'report_summary',
        metrics,
        topProducts,
        recentSales,
        salesChart,
        inventory: inventory.slice(0, 20).map(i => ({
          product: i.products?.name,
          quantity: i.quantity,
          threshold: i.low_stock_threshold,
        })),
        period,
      })
      const data = await res.json()
      if (data.error === 'AI not configured') { setConfigured(false); return }
      if (data.summary) {
        setAICached(cacheKey, data.summary, AI_TTL.REPORT)
        setSummary(data.summary)
        onSummaryGenerated?.(data.summary)
      }
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  async function copy() {
    if (!summary) return
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!configured) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2C4B0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#7A3E2E]">AI Business Summary</h3>
            <p className="text-xs text-[#B89080]">Plain-language analysis of your business performance</p>
          </div>
        </div>
        {summary && (
          <button onClick={copy}
            className="flex items-center gap-1 text-xs text-[#B89080] hover:text-[#7A3E2E] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {!summary && !fetching && (
          <div className="flex flex-col items-center py-4 gap-3">
            <p className="text-xs text-[#B89080] text-center">
              Generate a plain-language summary of your business performance.<br />
              This will be included at the top of your PDF exports.
            </p>
            <button onClick={generate}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs rounded-lg transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Generate AI Summary
            </button>
          </div>
        )}

        {fetching && (
          <div className="flex flex-col gap-2 py-2">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-[#E8896A] animate-spin" />
              <span className="text-xs text-[#B89080]">Analyzing your business data…</span>
            </div>
            {[100, 85, 90, 70, 80].map((w, i) => (
              <div key={i} className={`h-2.5 bg-[#FDE8DF] rounded animate-pulse`}
                style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {summary && !fetching && (
          <div>
            <div className="text-xs text-[#7A3E2E] leading-relaxed whitespace-pre-line">
              {summary}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={generate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors">
                <RefreshCw className="w-3 h-3" />Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
