'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setLoading(false)
      }
    }
    check()
  }, [router])

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', background: '#1f2937', color: '#fff', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>TenantKit</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/dashboard/properties" style={{ color: '#fff', textDecoration: 'none' }}>Properties</Link>
          <Link href="/pricing" style={{ color: '#fff', textDecoration: 'none' }}>Pricing</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
    </div>
  )
}