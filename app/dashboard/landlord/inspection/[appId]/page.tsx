'use client'
import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { renderToStream } from '@react-pdf/renderer'
import { InspectionPDF } from '../../../../components/InspectionPDF'

export default function LandlordInspectionPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params)
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [application, setApplication] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  
  // Inspection data
  const [overallCondition, setOverallCondition] = useState('good')
  const [issues, setIssues] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: app } = await supabase.from('applications').select('*').eq('id', appId).single()
      if (app) {
        setApplication(app)
        setOverallCondition(app.landlord_inspection_condition || 'good')
        setIssues(app.landlord_inspection_issues || '')
        
        const { data: prop } = await supabase.from('properties').select('*').eq('id', app.property_id).single()
        setProperty(prop)
      }
      setLoading(false)
    }
    fetch()
  }, [appId])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const uploadedUrls: string[] = []

      // Upload photos
      if (photos.length > 0) {
        setUploading(true)
        for (const photo of photos) {
          const ext = photo.name.split('.').pop()
          const name = `landlord-inspection/${appId}/${Date.now()}-${Math.random()}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('inspection-photos').upload(name, photo)
          if (uploadErr) throw uploadErr
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${name}`
          uploadedUrls.push(url)
        }
        setUploading(false)
      }

      // Update application with landlord inspection data
      const { error: updateErr } = await supabase
        .from('applications')
        .update({
          landlord_inspection_completed: true,
          landlord_inspection_condition: overallCondition,
          landlord_inspection_issues: issues,
          landlord_inspection_photos: uploadedUrls,
          landlord_inspection_date: new Date().toISOString()
        })
        .eq('id', appId)

      if (updateErr) throw updateErr
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save inspection')
    }

    setSaving(false)
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href={`/dashboard/applications/${appId}`} className="text-green-600 hover:underline inline-block mb-4">← Back to Application</Link>
      
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Landlord Move-In Inspection</h1>
      
      {property && (
        <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <strong>Property:</strong> {property.address}{property.unit ? `, Unit ${property.unit}` : ''}
        </div>
      )}

      <button 
          onClick={async () => {
            const stream = await renderToStream(
              <InspectionPDF 
                application={application} 
                property={property}
                photos={application.landlord_inspection_photos}
              />
            )
            const chunks: any[] = []
            for await (const chunk of stream) {
              chunks.push(chunk)
            }
            const blob = new Blob(chunks, { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
          }}
          style={{ 
            background: '#4b5563', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.375rem', 
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Download PDF
        </button>

        {success ? (
        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', color: '#10b981' }}>
          <h2 style={{ fontWeight: 600 }}>Inspection Saved!</h2>
          <p>Your inspection has been submitted. The tenant can now view it.</p>
          <Link href={`/dashboard/applications/${appId}`} className="text-green-600 hover:underline">← Back to Application</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Overall Condition</label>
            <select 
              value={overallCondition} 
              onChange={(e) => setOverallCondition(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Issues / Notes</label>
            <textarea 
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="Report any issues, damages, or concerns noted during inspection..."
              rows={6}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Upload Photos</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoChange}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
            />
            {photos.length > 0 && (
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>{photos.length} photo(s) selected</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={saving || uploading}
            style={{ 
              background: '#10b981', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.375rem', 
              border: 'none',
              fontWeight: 500,
              cursor: saving || uploading ? 'not-allowed' : 'pointer',
              opacity: saving || uploading ? 0.6 : 1
            }}
          >
            {saving || uploading ? 'Saving...' : 'Submit Inspection'}
          </button>
        </form>
      )}
    </div>
  )
}