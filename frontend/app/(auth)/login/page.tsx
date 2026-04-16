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
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-[#F2C4B0] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-[#7A3E2E] mb-1">Talastock</h1>
          <p className="text-xs text-[#B89080]">Inventory & Sales Dashboard</p>
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

          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[#C05050] mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link 
              href="/forgot-password"
              className="text-xs text-[#E8896A] hover:text-[#C1614A] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
