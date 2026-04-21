'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FDF6F0]">
      {/* Left Side - Extra Large Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <Image
            src="/images/talastock_icon-removebg-preview.png"
            alt="Talastock"
            width={800}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/images/talastock_icon-removebg-preview.png"
              alt="Talastock Logo"
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#F2C4B0] p-6 shadow-lg">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-[#7A3E2E] mb-1">Welcome Back!</h1>
              <p className="text-sm text-[#B89080]">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-[#7A3E2E] mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-11 text-sm"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-[#C05050] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-[#7A3E2E] mb-1.5 block">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-11 text-sm"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-[#C05050] mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end -mt-1">
                <Link 
                  href="/forgot-password"
                  className="text-xs font-medium text-[#E8896A] hover:text-[#C1614A] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0 h-11 text-sm font-medium shadow-md hover:shadow-lg transition-all mt-1"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#FDE8DF] text-center">
              <p className="text-xs text-[#B89080]">
                🔒 Secure login powered by Supabase
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
