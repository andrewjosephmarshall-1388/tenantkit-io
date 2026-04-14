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
        <Link href="/dashboard/properties" className="block">
          <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Properties</div>
            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.properties}</div>
          </div>
        </Link>
        <Link href="/dashboard/applications" className="block">
          <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Applications</div>
            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.applications}</div>
          </div>
        </Link>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/dashboard/properties" className="text-green-600 hover:underline">Manage Properties →</Link>
        <p><Link href="/dashboard/profile" className="text-green-600 hover:underline">Edit Profile →</Link></p>
        <p><Link href="/dashboard/applications" className="text-green-600 hover:underline">View All Applications →</Link></p>
      </div>
      {/* Ad for landlords */}
      <div style={{ marginTop: '2rem', background: '#f3f4f6', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Advertisement</p>
        <a href="https://www.checkrtrust.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#fff', padding: '0.75rem', borderRadius: '0.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textDecoration: 'none' }}>
          <span style={{ color: '#2563eb', fontWeight: 500 }}>Run Background Checks on Applicants</span>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Fast, reliable tenant screening →</p>
        </a>
      </div>
    </div>
  )
}
