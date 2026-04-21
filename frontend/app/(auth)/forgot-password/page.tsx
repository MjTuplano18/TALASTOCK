'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Key } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const resetPasswordSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')

  const emailForm = useForm<ForgotPasswordForm>({ 
    resolver: zodResolver(forgotPasswordSchema) 
  })

  const resetForm = useForm<ResetPasswordForm>({ 
    resolver: zodResolver(resetPasswordSchema) 
  })

  async function onSubmitEmail(data: ForgotPasswordForm) {
    setLoading(true)
    try {
      // Send OTP code via email
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      setEmail(data.email)
      setStep('code')
      toast.success('Reset code sent! Check your email.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitReset(data: ResetPasswordForm) {
    setLoading(true)
    try {
      // Verify OTP and update password
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: data.code,
        type: 'recovery',
      })

      if (error) throw error

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) throw updateError

      toast.success('Password updated successfully!')
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Enter Email
  if (step === 'email') {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#E8896A]" />
            </div>
            <h1 className="text-2xl font-medium text-[#7A3E2E] mb-1">Forgot Password</h1>
            <p className="text-xs text-[#B89080]">
              Enter your email to receive a reset code
            </p>
          </div>

          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
                {...emailForm.register('email')}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-[#C05050] mt-1">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0 mt-2"
            >
              {loading ? 'Sending…' : 'Send Reset Code'}
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

  // Step 2: Enter Code and New Password
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
            <Key className="w-6 h-6 text-[#E8896A]" />
          </div>
          <h1 className="text-2xl font-medium text-[#7A3E2E] mb-1">Reset Password</h1>
          <p className="text-xs text-[#B89080]">
            Enter the code sent to
          </p>
          <p className="text-xs font-medium text-[#7A3E2E] mt-1">
            {email}
          </p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Reset Code</label>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] text-center text-lg tracking-widest font-mono"
              {...resetForm.register('code')}
            />
            {resetForm.formState.errors.code && (
              <p className="text-xs text-[#C05050] mt-1">
                {resetForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-[#B89080] mb-1 block">New Password</label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...resetForm.register('password')}
            />
            {resetForm.formState.errors.password && (
              <p className="text-xs text-[#C05050] mt-1">
                {resetForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Confirm Password</label>
            <Input
              type="password"
              placeholder="Re-enter password"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...resetForm.register('confirmPassword')}
            />
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-[#C05050] mt-1">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0 mt-2"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline"
          >
            Didn't receive code? Try again
          </button>

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
