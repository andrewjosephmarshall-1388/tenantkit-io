'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    features: [
      'Up to 5 active properties',
      'Unlimited tenant applications',
      'PDF export for each application',
      'Email support',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    setLoading('free')
    setError('')

    try {
      // Ensure user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please sign in first')
        setLoading(null)
        return
      }

      // Free plan - just redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(null)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>Choose a Plan</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#6b7280' }}>
        Start collecting tenant applications today. Cancel anytime.
      </p>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {PLANS.map((plan) => (
          <div key={plan.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{plan.name}</h2>
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>${plan.price}</span>
              <span style={{ color: '#6b7280' }}> /{plan.interval}</span>
            </div>
            <ul style={{ flex: 1, listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Check size={16} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe()}
              disabled={loading !== null}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading === 'free' ? 0.7 : 1,
              }}
            >
              {loading === 'free' ? 'Redirecting…' : 'Get Started — Free'}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#9ca3af' }}>
        Already have an account? <Link href="/dashboard" style={{ color: '#2563eb' }}>Go to Dashboard</Link>
      </p>
    </div>
  )
}