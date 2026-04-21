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
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/images/talastock_icon_only.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/images/talastock_icon_only.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/images/talastock_icon_only.png" />
      </head>
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
