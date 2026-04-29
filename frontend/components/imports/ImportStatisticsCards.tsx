'use client'

import { FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ImportStatistics } from '@/types'

interface ImportStatisticsCardsProps {
  statistics: ImportStatistics
}

export function ImportStatisticsCards({ statistics }: ImportStatisticsCardsProps) {
  const successRate = statistics.success_rate || 0
  const qualityScore = statistics.avg_quality_score || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Imports */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
          <FileText className="w-4 h-4 text-[#E8896A]" />
        </div>
        <p className="text-xs text-[#B89080] mb-1">Total Imports</p>
        <p className="text-2xl font-medium text-[#7A3E2E]">
          {statistics.total_imports.toLocaleString()}
        </p>
        <p className="text-xs text-[#B89080] mt-1">Last 30 days</p>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
          <CheckCircle className="w-4 h-4 text-[#E8896A]" />
        </div>
        <p className="text-xs text-[#B89080] mb-1">Success Rate</p>
        <p className={`text-2xl font-medium ${getSuccessRateColor(successRate)}`}>
          {successRate.toFixed(1)}%
        </p>
        <p className="text-xs text-[#B89080] mt-1">
          {statistics.successful_imports} of {statistics.total_imports} successful
        </p>
      </div>

      {/* Rows Processed */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
          <TrendingUp className="w-4 h-4 text-[#E8896A]" />
        </div>
        <p className="text-xs text-[#B89080] mb-1">Rows Processed</p>
        <p className="text-2xl font-medium text-[#7A3E2E]">
          {statistics.total_rows_processed.toLocaleString()}
        </p>
        <p className="text-xs text-[#B89080] mt-1">
          Avg {Math.round(statistics.avg_processing_time_ms)}ms per import
        </p>
      </div>

      {/* Quality Score */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
          <AlertTriangle className="w-4 h-4 text-[#E8896A]" />
        </div>
        <p className="text-xs text-[#B89080] mb-1">Avg Quality Score</p>
        <p className={`text-2xl font-medium ${getQualityScoreColor(qualityScore)}`}>
          {qualityScore.toFixed(1)}%
        </p>
        <p className="text-xs text-[#B89080] mt-1">Data quality metric</p>
      </div>
    </div>
  )
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 95) return 'text-green-600'
  if (rate >= 80) return 'text-[#E8896A]'
  return 'text-[#C05050]'
}

function getQualityScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-[#E8896A]'
  return 'text-[#C05050]'
}
