'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const propertyId = params.id as string

  const [property, setProperty] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setError('Not authenticated')

      const res = await fetch(`${window.location.origin}/api/landlord/properties?userId=${user.id}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        const prop = data.properties?.find((p: any) => p.id === propertyId)
        if (prop) {
          setProperty(prop)
          setApplication(prop.applications?.[0] || null)
        } else {
          setError('Property not found')
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [propertyId])

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>
  if (!property) return <div style={{ padding: '2rem' }}>Property not found</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href="/dashboard/properties" className="text-gray-800 hover:underline">← Back to Properties</Link>
      
      <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{property.address} {property.unit && `(${property.unit})`}</h1>
        <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Monthly Rent: ${property.rent}</p>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Tenant Application Link</h2>
          {application ? (
            <div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Status: <span style={{ fontWeight: 600, color: application.status === 'complete' ? '#10B981' : '#F59E0B' }}>{application.status}</span></p>
              <a href={`${window.location.origin}/apply/${application.token}`} target="_blank" rel="noopener noreferrer" className="block mt-2 text-green-600 hover:underline break-all" >
                {window.location.origin}/apply/{application.token}
              </a>
            </div>
          ) : (
            <p style={{ marginTop: '0.5rem', color: '#6B7280' }}>No application yet</p>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Link href={`/dashboard/properties/${propertyId}/forms`} className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
            Manage Forms
          </Link>
        </div>
      </div>
    </div>
  )
}