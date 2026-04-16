'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) })

  const password = watch('password', '')

  // Check if we have a valid session (token from email link)
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          setTokenError(true)
        }
      } catch (err) {
        setTokenError(true)
      } finally {
        setCheckingToken(false)
      }
    }
    
    checkSession()
  }, [])

  async function onSubmit(data: ResetPasswordForm) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })
      
      if (error) throw error
      
      setResetSuccess(true)
      toast.success('Password reset successfully!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('expired') || err.message.includes('invalid')) {
          setTokenError(true)
          toast.error('Reset link expired. Please request a new one.')
        } else {
          toast.error(err.message)
        }
      } else {
        toast.error('Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking token
  if (checkingToken) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-4 animate-pulse">
              <svg
                className="w-6 h-6 text-[#E8896A]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-sm text-[#B89080]">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if token is invalid or expired
  if (tokenError) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDECEA] flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-[#C05050]" />
            </div>
            <h1 className="text-2xl font-medium text-[#7A3E2E] mb-2">Link Expired</h1>
            <p className="text-sm text-[#B89080]">
              This password reset link has expired or is invalid.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/forgot-password">
              <Button
                type="button"
                className="w-full bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
              >
                Request New Link
              </Button>
            </Link>

            <Link href="/login">
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show success state
  if (resetSuccess) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#E8896A]" />
            </div>
            <h1 className="text-2xl font-medium text-[#7A3E2E] mb-2">Password Reset!</h1>
            <p className="text-sm text-[#B89080]">
              Your password has been successfully reset.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-[#B89080] text-center">
              Redirecting you to login...
            </p>

            <Link href="/login">
              <Button
                type="button"
                className="w-full bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
              >
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: '' }
    if (pwd.length < 8) return { label: 'Too short', color: 'text-[#C05050]' }
    
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++

    if (strength <= 2) return { label: 'Weak', color: 'text-[#C05050]' }
    if (strength <= 3) return { label: 'Fair', color: 'text-[#B89080]' }
    if (strength <= 4) return { label: 'Good', color: 'text-[#E8896A]' }
    return { label: 'Strong', color: 'text-[#C1614A]' }
  }

  const passwordStrength = getPasswordStrength(password)

  // Show reset password form
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-[#7A3E2E] mb-1">Reset Password</h1>
          <p className="text-xs text-[#B89080]">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[#C05050] mt-1">{errors.password.message}</p>
            )}
            {password && !errors.password && (
              <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                Password strength: {passwordStrength.label}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-[#C05050] mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-[#FDE8DF] rounded-lg p-3 mt-2">
            <p className="text-xs text-[#7A3E2E] font-medium mb-2">Password Requirements:</p>
            <ul className="text-xs text-[#B89080] space-y-1">
              <li className="flex items-center gap-2">
                <span className={password.length >= 8 ? 'text-[#E8896A]' : 'text-[#B89080]'}>
                  {password.length >= 8 ? '✓' : '○'}
                </span>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-[#E8896A]' : 'text-[#B89080]'}>
                  {/[A-Z]/.test(password) && /[a-z]/.test(password) ? '✓' : '○'}
                </span>
                Mix of uppercase and lowercase (recommended)
              </li>
              <li className="flex items-center gap-2">
                <span className={/\d/.test(password) ? 'text-[#E8896A]' : 'text-[#B89080]'}>
                  {/\d/.test(password) ? '✓' : '○'}
                </span>
                At least one number (recommended)
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0 mt-2"
          >
            {loading ? 'Resetting Password…' : 'Reset Password'}
          </Button>

          <Link href="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </form>
      </div>
    </div>
  )
}
