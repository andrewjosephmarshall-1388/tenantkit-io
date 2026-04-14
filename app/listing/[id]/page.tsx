'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PropertyListing() {
  const params = useParams()
  const id = params.id as string
  
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${id}`)
        const data = await res.json()
        
        if (data.error || !data[0]) {
          setError('Property not found')
        } else {
          setProperty(data[0])
        }
      } catch (err) {
        setError('Failed to load property')
      }
      setLoading(false)
    }
    
    if (id) fetchProperty()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280' }}>Loading...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#dc2626', fontSize: '1.25rem' }}>{error}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #eff6ff, #fff)' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669', textDecoration: 'none' }}>
            TenantKit
          </Link>
          <a 
            href={`/apply/${id}`}
            style={{ background: '#059669', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 500 }}
          >
            Apply Now
          </a>
        </div>
      </div>

      {/* Property Image */}
      <div style={{ height: '300px', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#065f46' }}>
          <svg style={{ width: '64px', height: '64px', marginBottom: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span style={{ fontSize: '1.125rem' }}>Rental Property</span>
        </div>
      </div>

      {/* Property Details */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                {property.address}
              </h1>
              {property.unit && (
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Unit {property.unit}</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {property.rent && (
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  ${parseInt(property.rent).toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6b7280' }}>/mo</span>
                </div>
              )}
              {property.security_deposit && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>${property.security_deposit} deposit</p>
              )}
            </div>
          </div>

          {/* Features */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Features</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {property.bedrooms && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#059669' }}>🛏️</span>
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
              )}
              {property.bathrooms && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#059669' }}>🚿</span>
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
              )}
              {property.sqft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#059669' }}>📐</span>
                  <span>{property.sqft} sq ft</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#059669' }}>✅</span>
                <span>Background Check Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#059669' }}>✅</span>
                <span>Online Application</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#059669' }}>✅</span>
                <span>Instant Submission</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Description</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{property.description}</p>
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <a 
              href={`/apply/${id}`}
              style={{ display: 'inline-block', background: '#059669', color: '#fff', padding: '0.75rem 2rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '1.125rem' }}
            >
              Apply Now — Free
            </a>
            <p style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Optional background check available for $32.50
            </p>
          </div>
        </div>

        {/* Share this listing */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Share this listing: <span style={{ color: '#059669' }}>{typeof window !== 'undefined' ? window.location.href : ''}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '1.5rem 0', marginTop: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          Powered by <Link href="/" style={{ color: '#059669', textDecoration: 'none' }}>TenantKit</Link>
        </div>
      </footer>
    </div>
  )
}