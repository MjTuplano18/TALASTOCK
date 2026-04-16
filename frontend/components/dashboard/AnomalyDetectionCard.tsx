'use client'

import { useState, useEffect } from 'react'
import { Zap, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, clearAICacheKey, AI_TTL } from '@/lib/ai-cache'
import type { SalesChartData, TopProductData, InventoryItem } from '@/types'

const CACHE_KEY = 'talastock:ai:anomalies'

interface Anomaly {
  type: 'drop' | 'spike' | 'low_stock' | 'trend'
  product: string | null
  date: string | null
  description: string
  suggestion: string
}

const ANOMALY_CONFIG = {
  drop:      { icon: TrendingDown, color: 'text-[#C05050]', bg: 'bg-[#FDECEA]', label: 'Sales Drop' },
  spike:     { icon: TrendingUp,   color: 'text-[#C1614A]', bg: 'bg-[#FDE8DF]', label: 'Sales Spike' },
  low_stock: { icon: AlertTriangle, color: 'text-[#C05050]', bg: 'bg-[#FDECEA]', label: 'Low Stock' },
  trend:     { icon: BarChart2,    color: 'text-[#7A3E2E]', bg: 'bg-[#FDF6F0]', label: 'Trend' },
}

interface AnomalyDetectionCardProps {
  salesChart: SalesChartData[]
  topProducts: TopProductData[]
  inventory: InventoryItem[]
  loading?: boolean
}

export function AnomalyDetectionCard({ salesChart, topProducts, inventory, loading }: AnomalyDetectionCardProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [fetched, setFetched] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    const cached = getAICached(CACHE_KEY)
    if (cached) {
      try {
        setAnomalies(JSON.parse(cached))
        setFetched(true)
      } catch {}
    }
  }, [])

  // Auto-fetch on mount if no cache and has data
  useEffect(() => {
    if (!loading && !fetched && salesChart.length >= 3) {
      fetchAnomalies(false)
    }
  }, [loading, salesChart.length])

  function handleRefresh() {
    fetchAnomalies(true) // Force refresh, bypass cache
  }

  async function fetchAnomalies(forceRefresh = false) {
    if (loading || salesChart.length < 3) return
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
            setAnomalies(JSON.parse(cached))
            setFetched(true)
            setFetching(false)
            return
          } catch {}
        }
      }

      const res = await aiPost({
        type: 'anomaly_detection',
        salesChart,
        topProducts,
        inventory: inventory.map(i => ({
          product: i.products?.name ?? i.product_id,
          quantity: i.quantity,
          threshold: i.low_stock_threshold,
        })),
      })
      const data = await res.json()
      if (data.error === 'AI not configured') { setConfigured(false); return }
      const result = data.anomalies ?? []
      setAICached(CACHE_KEY, JSON.stringify(result), AI_TTL.ANOMALY)
      setAnomalies(result)
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
            <Zap className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#7A3E2E]">Anomaly Detection</span>
            <span className="text-xs text-[#B89080]">Pattern analysis</span>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={fetching || loading}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Re-analyze">
          <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
        </button>
      </div>

      {anomalies.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-[#FDECEA] border border-[#F2C4B0] rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
            <span className="text-xs text-[#C05050] font-medium">
              {anomalies.length} {anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected
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
        ) : anomalies.length > 0 ? (
          <div className="flex flex-col gap-2">
            {anomalies.map((a, i) => {
              const config = ANOMALY_CONFIG[a.type] ?? ANOMALY_CONFIG.trend
              const Icon = config.icon
              return (
                <div key={i} className={cn('rounded-xl p-3 border border-[#F2C4B0] hover:shadow-sm transition-shadow', config.bg)}>
                  <div className="flex items-start gap-2">
                    <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
                        {a.product && <span className="text-xs text-[#7A3E2E]">· {a.product}</span>}
                        {a.date && <span className="text-xs text-[#B89080]">· {a.date}</span>}
                      </div>
                      <p className="text-sm text-[#7A3E2E] leading-relaxed mb-1">{a.description}</p>
                      <p className="text-xs text-[#B89080] italic">{a.suggestion}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : fetched ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-[#E8896A]" />
            </div>
            <p className="text-sm text-[#7A3E2E] font-medium mb-1">All clear!</p>
            <p className="text-xs text-[#B89080]">No anomalies detected — everything looks normal.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-[#E8896A]" />
            </div>
            <p className="text-sm text-[#7A3E2E] font-medium mb-1">Analyzing patterns...</p>
            <p className="text-xs text-[#B89080]">Click refresh to detect anomalies</p>
          </div>
        )}
      </div>
    </div>
  )
}
