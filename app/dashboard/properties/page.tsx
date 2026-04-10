'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { Plus } from 'lucide-react'

export default function PropertiesPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setError('Not authenticated')
      const { data, error } = await supabase
        .from('properties')
        .select('*, applications!inner(token, status)')
        .eq('landlord_id', user.id)
      if (error) setError(error.message)
      else setProperties(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>My Properties</h1>
        <Link href="/dashboard/properties/new" style={{ display: 'inline-flex', alignItems: 'center', background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', textDecoration: 'none' }}>
          <Plus size={16} style={{ marginRight: '0.25rem' }} />Add Property
        </Link>
      </div>
      {properties.length === 0 ? (
        <p>No properties yet. <Link href="/dashboard/properties/new" style={{ color: '#2563eb' }}>Create one</Link></p>
      ) : (
        properties.map(prop => (
          <div key={prop.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{prop.address}{prop.unit ? `, ${prop.unit}` : ''}</h2>
            {prop.rent && <p>Rent: ${prop.rent}</p>}
            <p>Share link: <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/apply/${prop.applications?.[0]?.token}`} target="_blank" rel="noopener noreferrer" style={{ color: '#065f46' }}>{process.env.NEXT_PUBLIC_BASE_URL}/apply/{prop.applications?.[0]?.token}</a></p>
            <p><Link href={`/dashboard/properties/${prop.id}/forms`} style={{ color: '#2563eb' }}>Manage Forms</Link></p>
            <h4>Applications</h4>
            {prop.applications && prop.applications.length > 0 ? (
              <ul>
                {prop.applications.map((app: any) => (
                  <li key={app.id}>Status: {app.status} – <Link href={`/dashboard/applications/${app.id}`} style={{ color: '#2563eb' }}>View</Link></li>
                ))}
              </ul>
            ) : (
              <p>No applications yet.</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}
