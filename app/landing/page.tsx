'use client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>TenantKit</h1>
      <p style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '2rem' }}>
        A secure portal for landlords to collect all tenant information – ID, income docs, photos, and a custom move‑in checklist – in one place. Generates a polished PDF for easy record‑keeping and lets you charge a small monthly subscription.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link href="/auth/signup" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}>
          Get Started – Free Trial
        </Link>
        <Link href="/auth/login" style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}>
          Sign In
        </Link>
      </div>
    </div>
  )
}
