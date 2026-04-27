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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/trend?${params.toString()}`
      console.log('Fetching payments trend:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Payments trend API error:', response.status, errorText)
        throw new Error(`Failed to fetch payment trend: ${response.status}`)
      }

      const result = await response.json()
      console.log('Payments trend response:', result)
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
