'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NewPropertyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [address, setAddress] = useState('')
  const [unit, setUnit] = useState('')
  const [rent, setRent] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [listingLink, setListingLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!address) return setError('Address is required')
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error('Not authenticated')

      const res = await fetch(`${window.location.origin}/api/landlord/properties/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          unit,
          rent,
          security_deposit: securityDeposit,
          userId
        })
      })
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Show the shareable links
      setShareLink(`${window.location.origin}/apply/${data.token}`)
      setListingLink(`${window.location.origin}/listing/${data.propertyId}`)
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
        <input
          type="number"
          placeholder="Security deposit (optional)"
          value={securityDeposit}
          onChange={e => setSecurityDeposit(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50" >
          {loading ? 'Creating…' : 'Create Property & Get Link'}
        </button>
      </form>
      {shareLink && (
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Application Link (send to tenant):</p>
          <a href={shareLink} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', color: '#065f46' }}>{shareLink}</a>
        </div>
      )}
      {listingLink && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Marketing Page (share on Facebook, Craigslist, etc):</p>
          <a href={listingLink} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', color: '#1e40af' }}>{listingLink}</a>
        </div>
      )}
    </div>
  )
}