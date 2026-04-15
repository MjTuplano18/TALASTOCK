'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, RefreshCw, TrendingDown, DollarSign } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { aiPost } from '@/lib/ai-fetch'
import { getAICached, setAICached, AI_TTL } from '@/lib/ai-cache'
import type { DeadStockItem, TopProductData, CategoryPerformance } from '@/types'

const CACHE_KEY = 'talastock:ai:dead_stock_recovery'

interface RecoveryStrategy {
  product: string
  sku: string
  tied_up_value: number
  strategy: string
  expected_recovery: number
  timeline: string
  priority: 'high' | 'medium' | 'low'
}

interface RecoveryAnalysis {
  total_items: number
  total_tied_up: number
  total_recoverable: number
  recovery_rate: number
  strategies: RecoveryStrategy[]
  summary: string
}

interface DeadStockRecoveryCardProps {
  deadStock: DeadStockItem[]
  topProducts: TopProductData[]
  categoryPerformance: CategoryPerformance[]
  totalRevenue: number
  loading?: boolean
}

export function DeadStockRecoveryCard({ 
  deadStock, 
  topProducts, 
  categoryPerformance,
  totalRevenue,
  loading 
}: DeadStockRecoveryCardProps) {
  const [analysis, setAnalysis] = useState<RecoveryAnalysis | null>(null)
  const [fetching, setFetching] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [fetched, setFetched] = useState(false)

  // Restore from cache on mount
  useEffect(() => {
    const cached = getAICached(CACHE_KEY)
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached))
        setFetched(true)
      } catch {}
    }
  }, [])

  // Auto-fetch on mount if no cache and has dead stock
  useEffect(() => {
    if (!loading && !fetched && deadStock.length > 0) {
      fetchAnalysis()
    }
  }, [loading, deadStock.length])

  async function fetchAnalysis() {
    if (loading || deadStock.length === 0) return
    setFetching(true)
    try {
      // Check cache first
      const cached = getAICached(CACHE_KEY)
      if (cached) {
        try {
          setAnalysis(JSON.parse(cached))
          setFetched(true)
          setFetching(false)
          return
        } catch {}
      }

      const res = await aiPost({
        type: 'dead_stock_recovery',
        deadStock: deadStock.slice(0, 10).map(item => ({
          product: item.product,
          sku: item.sku,
          quantity: item.quantity,
          value: item.value,
          days_since_last_sale: item.days_since_last_sale,
        })),
        topProducts: topProducts.slice(0, 5),
        categoryPerformance: categoryPerformance.slice(0, 5),
        totalRevenue,
        totalDeadStockValue: deadStock.reduce((sum, item) => sum + item.value, 0),
      })
      const data = await res.json()
      if (data.error === 'AI not configured') { setConfigured(false); return }
      const result = data.analysis
      setAICached(CACHE_KEY, JSON.stringify(result), AI_TTL.INSIGHT)
      setAnalysis(result)
      setFetched(true)
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  if (!configured) return null

  const totalTiedUp = deadStock.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-5 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#7A3E2E]">Dead Stock Recovery</span>
            <span className="text-xs text-[#B89080]">AI-powered strategies</span>
          </div>
        </div>
        <button onClick={fetchAnalysis} disabled={fetching || loading || deadStock.length === 0}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors disabled:opacity-40"
          title="Refresh analysis">
          <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
        </button>
      </div>

      {deadStock.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
            <Lightbulb className="w-6 h-6 text-[#E8896A]" />
          </div>
          <p className="text-sm text-[#7A3E2E] font-medium mb-1">No dead stock!</p>
          <p className="text-xs text-[#B89080]">All products are moving well</p>
        </div>
      ) : (
        <>
          {deadStock.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-[#FDECEA] border border-[#F2C4B0] rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#C05050] shrink-0" />
                  <span className="text-xs text-[#C05050] font-medium">
                    {deadStock.length} items · {formatCurrency(totalTiedUp)} tied up
                  </span>
                </div>
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
            ) : analysis ? (
              <div className="flex flex-col gap-3">
                {/* Summary */}
                <div className="bg-[#FDF6F0] border border-[#F2C4B0] rounded-xl p-3">
                  <p className="text-sm text-[#7A3E2E] leading-relaxed mb-2">{analysis.summary}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[#B89080]">Recoverable: </span>
                      <span className="text-[#C1614A] font-medium">{formatCurrency(analysis.total_recoverable)}</span>
                    </div>
                    <div>
                      <span className="text-[#B89080]">Rate: </span>
                      <span className="text-[#C1614A] font-medium">{analysis.recovery_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Top Strategies */}
                <div className="flex flex-col gap-2">
                  {analysis.strategies.slice(0, 3).map((strategy, i) => (
                    <div key={i} className="bg-[#FDF6F0] border border-[#F2C4B0] rounded-xl p-3 hover:bg-[#FDE8DF] transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#7A3E2E] truncate">{strategy.product}</span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              strategy.priority === 'high' ? 'bg-[#FDECEA] text-[#C05050]' :
                              strategy.priority === 'medium' ? 'bg-[#FDE8DF] text-[#C1614A]' :
                              'bg-[#FDF6F0] text-[#B89080]'
                            )}>
                              {strategy.priority}
                            </span>
                          </div>
                          <p className="text-xs text-[#B89080] font-mono mb-1">{strategy.sku}</p>
                          <p className="text-xs text-[#7A3E2E] leading-relaxed">{strategy.strategy}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#F2C4B0]">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#B89080]" />
                          <span className="text-xs text-[#B89080]">Recovery:</span>
                          <span className="text-xs text-[#C1614A] font-medium">{formatCurrency(strategy.expected_recovery)}</span>
                        </div>
                        <span className="text-xs text-[#B89080]">{strategy.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.strategies.length > 3 && (
                  <p className="text-xs text-[#B89080] text-center">
                    +{analysis.strategies.length - 3} more strategies available
                  </p>
                )}
              </div>
            ) : fetched ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
                  <Lightbulb className="w-6 h-6 text-[#E8896A]" />
                </div>
                <p className="text-sm text-[#7A3E2E] font-medium mb-1">Analysis complete</p>
                <p className="text-xs text-[#B89080]">No specific recovery strategies needed</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
                  <Lightbulb className="w-6 h-6 text-[#E8896A]" />
                </div>
                <p className="text-sm text-[#7A3E2E] font-medium mb-1">Analyzing dead stock...</p>
                <p className="text-xs text-[#B89080]">Click refresh to generate strategies</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
