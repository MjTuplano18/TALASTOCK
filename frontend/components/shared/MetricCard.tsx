import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  danger?: boolean
  change?: number | null  // % change vs last period
}

export function MetricCard({ label, value, sub, icon, danger, change }: MetricCardProps) {
  const hasChange = change !== null && change !== undefined
  const isUp = hasChange && change! >= 0

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
          {icon}
        </div>
        {hasChange && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-medium',
            isUp ? 'text-[#C1614A]' : 'text-[#B89080]'
          )}>
            {isUp
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change!).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs text-[#B89080] mb-0.5">{label}</p>
      <p className={cn('text-xl font-medium leading-tight', danger ? 'text-[#C05050]' : 'text-[#7A3E2E]')}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#B89080] mt-0.5">{sub}</p>}
    </div>
  )
}
