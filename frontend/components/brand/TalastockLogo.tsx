import { Package } from 'lucide-react'

interface TalastockLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function TalastockLogo({ size = 'md', showText = true, className = '' }: TalastockLogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xl' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-2xl' },
    xl: { container: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-4xl' },
  }

  const { container, icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${container} rounded-2xl bg-gradient-to-br from-[#E8896A] to-[#C1614A] flex items-center justify-center shadow-lg`}>
        <Package className={`${icon} text-white`} strokeWidth={2.5} />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-semibold text-[#7A3E2E] leading-none`}>
            Talastock
          </span>
          <span className="text-xs text-[#B89080] mt-0.5">
            Inventory & Sales
          </span>
        </div>
      )}
    </div>
  )
}
