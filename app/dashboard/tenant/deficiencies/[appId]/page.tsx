'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function DeficienciesPage({ params }: { params: { appId: string } }) {
  const supabase = createClient()
  const { appId } = params

  const [deficiencies, setDeficiencies] = useState<any[]>([])
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [landlordEmail, setLandlordEmail] = useState('')

  // fetch existing deficiencies and landlord email
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: defs, error: defsErr } = await supabase
        .from('deficiencies')
        .select('*')
        .eq('application_id', appId)
      if (defsErr) setError(defsErr.message)
      else setDeficiencies(defs || [])

      // get landlord email via application -> property -> landlord_id -> users
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .select('property_id')
        .eq('id', appId)
        .single()
      if (!appErr && app?.property_id) {
        const { data: prop, error: propErr } = await supabase
          .from('properties')
          .select('landlord_id')
          .eq('id', app.property_id)
          .single()
        if (!propErr && prop?.landlord_id) {
          const { data: user, error: userErr } = await supabase
            .from('users')
            .select('email,maintenance_email')
            .eq('id', prop.landlord_id)
            .single()
          if (!userErr) setLandlordEmail(user?.maintenance_email || user?.email || '')
        }
      }
      setLoading(false)
    }
    fetch()
  }, [appId, supabase])

  // preview selected photo
  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else setPreviewUrl('')
  }, [photo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)
    try {
      let photoUrl = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const name = `${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('inspection-photos')
          .upload(name, photo)
        if (uploadErr) throw uploadErr
        photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${name}`
      }
      const { error: insertErr } = await supabase.from('deficiencies').insert({
        application_id: appId,
        description,
        photo_url: photoUrl
      })
      if (insertErr) throw insertErr

      // send email notification to landlord (or maintenance)
      if (landlordEmail) {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: landlordEmail,
            subject: 'New Issue Reported by Tenant',
            html: `<p>A tenant has reported an issue:</p><p>${description}</p>` + (photoUrl ? `<p><a href="${photoUrl}">View Photo</a></p>` : '')
          })
        })
      }

      // refresh list
      const { data: refreshed } = await supabase.from('deficiencies').select('*').eq('application_id', appId)
      setDeficiencies(refreshed || [])
      setDescription('')
      setPhoto(null)
    } catch (err: any) {
      setError(err.message || 'Failed to submit')
    }
    setUploading(false)
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href={`/dashboard/applications/${appId}`} className="text-green-600 hover:underline">← Back to Application</Link>
      <h1 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Report Deficiencies</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <textarea placeholder="Describe the issue (e.g., stained carpet, leaking sink)" value={description}
          onChange={e => setDescription(e.target.value)} required style={{ padding: '0.5rem', minHeight: '80px' }} />
        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
        {previewUrl && <img src={previewUrl} alt="Preview" style={{ maxWidth: '200px', border: '1px solid #e5e7eb' }} />}
        {uploading && <p className="text-green-600">Uploading… please wait</p>}
        <button type="submit" disabled={uploading}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50">Submit Issue</button>
      </form>

      <h2 style={{ fontSize: '1.25rem' }}>Existing Reports</h2>
      {deficiencies.length === 0 ? <p>No reports yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {deficiencies.map(d => (
            <li key={d.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              <p>{d.description}</p>
              {d.photo_url && <img src={d.photo_url} alt="Deficiency" style={{ maxWidth: '200px' }} />}
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Reported at {new Date(d.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
