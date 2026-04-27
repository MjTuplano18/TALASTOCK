'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { supabase } from '@/lib/supabase'

interface PaymentCollectionChartProps {
  startDate?: Date
  endDate?: Date
}

interface ChartData {
  date: string
  amount: number
}

export function PaymentCollectionChart({ startDate, endDate }: PaymentCollectionChartProps) {
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

      // Build query params
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0])
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0])

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/trend?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch payment trend')

      const result = await response.json()
      const trendData = result.data || []
      
      setData(trendData)
    } catch (error) {
      console.error('Failed to fetch payment trend:', error)
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
        <p className="text-xs text-[#B89080]">No payment data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis dataKey="date" stroke="#B89080" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#B89080" fontSize={12} tickLine={false} axisLine={false}
          tickFormatter={(value) => `₱${value.toLocaleString()}`} />
        <Bar dataKey="amount" fill="#E8896A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Remove mock data generator — charts show empty state when no real data exists
