'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Boxes,
  TrendingUp,
  FileText,
  Tag,
  LogOut,
  Receipt,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { toast } from 'sonner'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Products',      href: '/products',      icon: Package },
  { label: 'Categories',    href: '/categories',    icon: Tag },
  { label: 'Inventory',     href: '/inventory',     icon: Boxes },
  { label: 'POS',           href: '/pos',           icon: ShoppingCart },
  { label: 'Sales',         href: '/sales',         icon: TrendingUp },
  { label: 'Transactions',  href: '/transactions',  icon: Receipt },
  { label: 'Reports',       href: '/reports',       icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo at top */}
      <div className={cn("px-5 py-4 border-b border-[#F2C4B0] flex items-center justify-center", collapsed && "px-3 py-3")}>
        <div className="w-12 h-12 flex items-center justify-center">
          <Image
            src="/images/talastock_icon_only.png"
            alt="Talastock"
            width={48}
            height={48}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Nav links */}
      <nav 
        className="flex-1 px-3 py-4 flex flex-col gap-1"
        aria-label="Main navigation"
      >
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'text-[#C1614A] font-medium'
                  : 'text-[#7A3E2E] hover:bg-[#FDF6F0]',
                collapsed && 'justify-center'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[#FDE8DF] rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  aria-hidden="true"
                />
              )}
              <Icon className="w-4 h-4 shrink-0 relative z-10" aria-hidden="true" />
              {!collapsed && <span className="relative z-10">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#F2C4B0]">
        <button
          onClick={handleSignOut}
          aria-label="Sign out of your account"
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#B89080] hover:bg-[#FDF6F0] hover:text-[#7A3E2E] w-full transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex shrink-0 bg-white border-r border-[#F2C4B0] flex-col transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-56"
        )}
        aria-label="Sidebar navigation"
      >
        {/* Desktop collapse toggle - positioned on the right edge */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-10 w-6 h-6 bg-white border border-[#F2C4B0] rounded-full flex items-center justify-center text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors shadow-sm"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
        <NavContent collapsed={isCollapsed} />
      </aside>

      {/* Tablet sidebar - always collapsed */}
      <aside 
        className="hidden md:flex lg:hidden w-16 shrink-0 bg-white border-r border-[#F2C4B0] flex-col"
        aria-label="Sidebar navigation"
      >
        <NavContent collapsed={true} />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-white border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:outline-none focus:ring-2 focus:ring-[#E8896A] focus:ring-offset-2 shadow-lg"
        onClick={() => setMobileOpen(v => !v)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
      >
        {mobileOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside 
            id="mobile-navigation"
            className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-[#F2C4B0] flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
