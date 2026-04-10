'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function NewPropertyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [address, setAddress] = useState('')
  const [unit, setUnit] = useState('')
  const [rent, setRent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shareLink, setShareLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!address) return setError('Address is required')
    setLoading(true)
    try {
      // 1️⃣ Insert property linked to current landlord
      const { data: userData } = await supabase.auth.getUser()
      const landlordId = userData.user?.id
      if (!landlordId) throw new Error('Not authenticated')

      const { data: property, error: propErr } = await supabase
        .from('properties')
        .insert({
          landlord_id: landlordId,
          address,
          unit,
          rent: rent ? parseFloat(rent) : null,
        })
        .select()
        .single()

      if (propErr) throw propErr

      // 2️⃣ Create an application entry with a unique token
      const token = uuidv4()
      const { error: appErr } = await supabase
        .from('applications')
        .insert({
          property_id: property.id,
          token,
          status: 'pending',
        })

      if (appErr) throw appErr

      // 3️⃣ Show the shareable link
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      setShareLink(`${base}/apply/${token}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', background: '#fff', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New Property / Application</h2>
      {error && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="text"
          placeholder="Property address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <input
          type="text"
          placeholder="Unit / Apartment (optional)"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <input
          type="number"
          placeholder="Monthly rent (optional)"
          value={rent}
          onChange={e => setRent(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', padding: '0.6rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Creating…' : 'Create Property & Get Link'}
        </button>
      </form>
      {shareLink && (
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
          <p>Share this link with your tenant:</p>
          <a href={shareLink} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', color: '#065f46' }}>{shareLink}</a>
        </div>
      )}
    </div>
  )
}
