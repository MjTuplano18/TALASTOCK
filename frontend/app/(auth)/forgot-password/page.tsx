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
import { ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordForm) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-[#7A3E2E] mb-2">Check your email</h1>
            <p className="text-sm text-[#B89080]">
              We sent a password reset link to
            </p>
            <p className="text-sm font-medium text-[#7A3E2E] mt-1">
              {getValues('email')}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-[#B89080] text-center">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>

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

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-[#7A3E2E] mb-1">Forgot Password</h1>
          <p className="text-xs text-[#B89080]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-[#C05050] mt-1">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0 mt-2"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
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
