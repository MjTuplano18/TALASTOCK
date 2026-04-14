'use client'

import { useState, useEffect } from 'react'
import { Zap, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, AI_TTL } from '@/lib/ai-cache'
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

  async function fetchAnomalies() {
    if (loading || salesChart.length < 3) return
    setFetching(true)
    try {
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

  // No auto-fetch on load — user must click (per ai-security.md)

  if (!configured) return null

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#E8896A]" />
          </div>
          <span className="text-xs font-medium text-[#7A3E2E]">Anomaly Detection</span>
          {anomalies.length > 0 && (
            <span className="text-[10px] bg-[#FDECEA] text-[#C05050] px-1.5 py-0.5 rounded-full font-medium">
              {anomalies.length} detected
            </span>
          )}
        </div>
        <button onClick={fetchAnomalies} disabled={fetching || loading}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Re-analyze">
          <RefreshCw className={cn('w-3 h-3', fetching && 'animate-spin')} />
        </button>
      </div>

      {fetching || loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-[#FDE8DF] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : anomalies.length > 0 ? (
        <div className="flex flex-col gap-2">
          {anomalies.map((a, i) => {
            const config = ANOMALY_CONFIG[a.type] ?? ANOMALY_CONFIG.trend
            const Icon = config.icon
            return (
              <div key={i} className={cn('rounded-xl p-3 border border-[#F2C4B0]', config.bg)}>
                <div className="flex items-start gap-2">
                  <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn('text-[10px] font-medium', config.color)}>{config.label}</span>
                      {a.product && <span className="text-[10px] text-[#7A3E2E]">· {a.product}</span>}
                      {a.date && <span className="text-[10px] text-[#B89080]">· {a.date}</span>}
                    </div>
                    <p className="text-xs text-[#7A3E2E] leading-relaxed">{a.description}</p>
                    <p className="text-[10px] text-[#B89080] mt-1 italic">{a.suggestion}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : fetched ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-5 h-5 rounded-full bg-[#FDE8DF] flex items-center justify-center">
            <span className="text-[10px] text-[#C1614A]">✓</span>
          </div>
          <p className="text-xs text-[#B89080]">No anomalies detected — everything looks normal.</p>
        </div>
      ) : (
        <p className="text-xs text-[#B89080]">Analyzing sales patterns…</p>
      )}
    </div>
  )
}
