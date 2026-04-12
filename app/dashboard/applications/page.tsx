'use client'
'use dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function ApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setError('Please log in to view applications')
    
    const res = await fetch(`${window.location.origin}/api/landlord/applications?userId=${user.id}`)
    const data = await res.json()
    
    if (data.error) {
      setError(data.error)
    } else {
      setApplications(data.applications || [])
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} color="#10B981" />
      case 'rejected':
        return <XCircle size={18} color="#DC2626" />
      default:
        return <Clock size={18} color="#F59E0B" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      default:
        return 'Pending'
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Applications</h1>

      {applications.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No applications yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {applications.map((app: any) => (
            <li key={app.id} style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                    {app.properties?.address} {app.properties?.unit && `(${app.properties.unit})`}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Applicant: {app.applicant_name || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Submitted: {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusIcon(app.status)}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: app.status === 'approved' ? '#10B981' : app.status === 'rejected' ? '#DC2626' : '#F59E0B'
                  }}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
              </div>
              <Link
                href={`/dashboard/applications/${app.id}`}
                className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              >
                View Details →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}