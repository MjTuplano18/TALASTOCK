import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const DEFAULT_GOAL = 50000

export function useRevenueGoal() {
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch goal from database
  async function fetchGoal() {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setGoal(DEFAULT_GOAL)
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/monthly_revenue_goal`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const goalValue = Number(result.data.value)
        setGoal(goalValue || DEFAULT_GOAL)
      } else {
        // If setting doesn't exist, use default
        setGoal(DEFAULT_GOAL)
      }
    } catch (err) {
      console.error('Failed to fetch revenue goal:', err)
      setError('Failed to load revenue goal')
      setGoal(DEFAULT_GOAL)
    } finally {
      setLoading(false)
    }
  }

  // Update goal in database
  async function updateGoal(newGoal: number) {
    try {
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return false
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/monthly_revenue_goal`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newGoal }),
      })

      if (!response.ok) {
        throw new Error('Failed to update revenue goal')
      }

      const result = await response.json()
      const goalValue = Number(result.data.value)
      setGoal(goalValue)
      return true
    } catch (err) {
      console.error('Failed to update revenue goal:', err)
      setError('Failed to update revenue goal')
      return false
    }
  }

  useEffect(() => {
    fetchGoal()
  }, [])

  return {
    goal,
    loading,
    error,
    updateGoal,
    refetch: fetchGoal,
  }
}
