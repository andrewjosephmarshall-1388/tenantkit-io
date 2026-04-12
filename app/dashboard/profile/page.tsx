'use client'
'use dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState({
    office_address: '',
    phone_number: '',
    landlord_email: '',
    landlord_website: '',
    maintenance_email: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setError('Not authenticated')
      const { data, error } = await supabase
        .from('users')
        .select('office_address, phone_number, landlord_email, landlord_website, maintenance_email')
        .eq('id', user.id)
        .single()
      if (error) setError(error.message)
      else setProfile({ office_address: data?.office_address || '', phone_number: data?.phone_number || '', landlord_email: data?.landlord_email || '', landlord_website: data?.landlord_website || '', maintenance_email: data?.maintenance_email || '' })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', user?.id)
    if (error) setError(error.message)
    else alert('Profile updated')
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1B', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem' }}>Landlord Profile</h1>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Office Address
          <input type="text" value={profile.office_address || ''}
            onChange={e => setProfile({ ...profile, office_address: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label>
          Maintenance Email (optional)
          <input type="email" value={profile.maintenance_email || ''}
            onChange={e => setProfile({ ...profile, maintenance_email: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label>
          Phone Number
          <input type="text" value={profile.phone_number || ''}
            onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label>
          Alternate Email
          <input type="email" value={profile.landlord_email || ''}
            onChange={e => setProfile({ ...profile, landlord_email: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label>
          Website
          <input type="url" value={profile.landlord_website || ''}
            onChange={e => setProfile({ ...profile, landlord_website: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem' }}>Save</button>
      </form>
      <p><Link href="/dashboard" style={{ color: '#2563eb' }}>Back to Dashboard</Link></p>
    </div>
  )
}
