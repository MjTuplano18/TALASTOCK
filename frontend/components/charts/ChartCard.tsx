import { ChartWrapper } from './ChartWrapper'

interface ChartCardProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function ChartCard({ title, children, action }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4 h-full min-h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#7A3E2E]">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      <ChartWrapper minHeight={240}>
        {children}
      </ChartWrapper>
    </div>
  )
}
