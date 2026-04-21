import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { UnregisterServiceWorker } from './UnregisterServiceWorker'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Talastock - Inventory & Sales Dashboard',
  description: 'Modern inventory and sales management dashboard for Filipino SMEs',
  icons: {
    icon: '/images/talastock_icon_only.png',
    shortcut: '/images/talastock_icon_only.png',
    apple: '/images/talastock_icon_only.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={`antialiased ${plusJakartaSans.className}`}>
        <UnregisterServiceWorker />
        <QueryProvider>
          {children}
          <Toaster 
            richColors 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                border: '1px solid #F2C4B0',
                color: '#7A3E2E',
              },
              className: 'toast-custom',
            }}
            closeButton={false}
            duration={3000}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
