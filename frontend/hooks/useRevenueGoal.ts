import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const DEFAULT_GOAL = 50000

export function useRevenueGoal() {
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch goal from database using Supabase directly
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

      // Query Supabase directly instead of backend API
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'monthly_revenue_goal')
        .single()

      if (fetchError) {
        console.error('Failed to fetch revenue goal:', fetchError)
        setGoal(DEFAULT_GOAL)
      } else if (data) {
        const goalValue = Number(data.value)
        setGoal(goalValue || DEFAULT_GOAL)
      } else {
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

  // Update goal in database using Supabase directly
  async function updateGoal(newGoal: number) {
    try {
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return false
      }

      // Update Supabase directly instead of backend API
      const { data, error: updateError } = await supabase
        .from('settings')
        .update({ value: newGoal })
        .eq('key', 'monthly_revenue_goal')
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update revenue goal:', updateError)
        return false
      }

      if (data) {
        const goalValue = Number(data.value)
        setGoal(goalValue)
        return true
      }

      return false
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
