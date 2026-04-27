'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { supabase } from '@/lib/supabase'

interface ChartData {
  name: string
  utilization: number
  balance: number
  limit: number
}

export function CreditUtilizationChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch customers with >50% credit utilization
      const { data: customers, error } = await supabase
        .from('customers')
        .select('name, current_balance, credit_limit')
        .eq('is_active', true)
        .gt('credit_limit', 0)
        .order('current_balance', { ascending: false })
        .limit(10)

      if (error) throw error

      // Calculate utilization and filter >50%
      const chartData = customers
        .map(c => ({
          name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
          utilization: (c.current_balance / c.credit_limit) * 100,
          balance: c.current_balance,
          limit: c.credit_limit,
        }))
        .filter(c => c.utilization > 50)
        .slice(0, 8) // Show top 8

      setData(chartData)
    } catch (error) {
      console.error('Failed to fetch credit utilization:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <p className="text-xs text-[#B89080]">No customers using >50% of credit limit</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" horizontal={false} />
        <XAxis type="number" stroke="#B89080" fontSize={12} tickLine={false} axisLine={false}
          tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
        <YAxis type="category" dataKey="name" stroke="#B89080" fontSize={11} 
          tickLine={false} axisLine={false} width={100} />
        <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={entry.utilization >= 80 ? '#C05050' : entry.utilization >= 70 ? '#E8896A' : '#C1614A'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
