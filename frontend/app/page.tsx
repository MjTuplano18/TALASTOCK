import { redirect } from 'next/navigation'

// Force dynamic rendering to avoid build timeout
export const dynamic = 'force-dynamic'

export default function RootPage() {
  redirect('/dashboard')
}
