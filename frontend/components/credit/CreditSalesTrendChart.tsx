'use client'

import { useState, useEffect } from 'react'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface CreditSalesTrendChartProps {
  startDate?: Date
  endDate?: Date
}

interface ChartData {
  date: string
  amount: number
}

export function CreditSalesTrendChart({ startDate, endDate }: CreditSalesTrendChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Build query params - if no dates provided, backend will default to last 30 days
      const params = new URLSearchParams()
      
      // Safely convert dates to ISO string
      if (startDate) {
        const dateStr = startDate instanceof Date 
          ? startDate.toISOString().split('T')[0]
          : new Date(startDate).toISOString().split('T')[0]
        params.append('start_date', dateStr)
      }
      
      if (endDate) {
        const dateStr = endDate instanceof Date 
          ? endDate.toISOString().split('T')[0]
          : new Date(endDate).toISOString().split('T')[0]
        params.append('end_date', dateStr)
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/credit-sales/trend?${params.toString()}`
      console.log('Fetching credit sales trend:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Credit sales trend API error:', response.status, errorText)
        throw new Error(`Failed to fetch credit sales trend: ${response.status}`)
      }

      const result = await response.json()
      console.log('Credit sales trend response:', result)
      const trendData = result.data || []
      
      setData(trendData)
    } catch (error) {
      console.error('Failed to fetch credit sales trend:', error)
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
        <p className="text-xs text-[#B89080]">No credit sales data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis dataKey="date" stroke="#B89080" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#B89080" fontSize={12} tickLine={false} axisLine={false}
          tickFormatter={(value) => `₱${value.toLocaleString()}`} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #F2C4B0', 
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(value: number) => [formatCurrency(value), 'Sales']}
          labelStyle={{ color: '#7A3E2E', fontWeight: 500 }}
        />
        <Line type="monotone" dataKey="amount" stroke="#E8896A" strokeWidth={2}
          dot={{ fill: '#E8896A', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Remove mock data generator — charts show empty state when no real data exists
