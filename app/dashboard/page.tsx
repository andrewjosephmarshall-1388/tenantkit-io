'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ properties: 0, applications: 0 })
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: props } = await supabase.from('properties').select('id').eq('landlord_id', user.id)
      const { data: apps } = await supabase.from('applications').select('id').eq('property_id', props?.map(p => p.id))
      setStats({
        properties: props?.length || 0,
        applications: apps?.length || 0
      })
    }
    fetchData()
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Properties</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.properties}</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Applications</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.applications}</div>
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
  {/* Simple bar chart */}
  <svg width="100%" height="80" style={{ marginBottom: '1rem' }}>
    <rect x="10%" y={80 - (stats.properties / Math.max(stats.properties, stats.applications, 1)) * 70} width="30%" height={(stats.properties / Math.max(stats.properties, stats.applications, 1)) * 70} fill="#10b981" />
    <rect x="60%" y={80 - (stats.applications / Math.max(stats.properties, stats.applications, 1)) * 70} width="30%" height={(stats.applications / Math.max(stats.properties, stats.applications, 1)) * 70} fill="#10b981" />
    <text x="25%" y="78" textAnchor="middle" fill="#333" fontSize="12">Props</text>
    <text x="75%" y="78" textAnchor="middle" fill="#333" fontSize="12">Apps</text>
  </svg>
  <Link href="/dashboard/properties" className="text-green-600 hover:underline">Manage Properties →</Link>
  <p><Link href="/dashboard/profile" className="text-green-600 hover:underline">Edit Profile →</Link></p>
  <p><Link href="/dashboard/applications" className="text-green-600 hover:underline">View All Applications →</Link></p>
</div>
    </div>
  )
}
