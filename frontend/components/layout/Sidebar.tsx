'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Boxes,
  TrendingUp,
  FileText,
  Tag,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { toast } from 'sonner'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Products',   href: '/products',   icon: Package },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Inventory',  href: '/inventory',  icon: Boxes },
  { label: 'Sales',      href: '/sales',      icon: TrendingUp },
  { label: 'Reports',    href: '/reports',    icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#F2C4B0]">
        <h1 className="text-base font-medium text-[#7A3E2E]">Talastock</h1>
        <p className="text-xs text-[#B89080]">Inventory & Sales</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-[#FDE8DF] text-[#C1614A] font-medium'
                  : 'text-[#7A3E2E] hover:bg-[#FDF6F0]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#F2C4B0]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#B89080] hover:bg-[#FDF6F0] hover:text-[#7A3E2E] w-full transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-[#F2C4B0] flex-col">
        <NavContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center bg-white border border-[#F2C4B0] rounded-lg text-[#7A3E2E]"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-56 bg-white border-r border-[#F2C4B0] flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
