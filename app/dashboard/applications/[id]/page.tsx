'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { renderToStream } from '@react-pdf/renderer'
import { ApplicationPDF } from '../../../components/ApplicationPDF'

export default function ApplicationDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const appId = params.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [application, setApplication] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .select('*')
        .eq('id', appId)
        .single()
      if (appErr || !app) return setError('Application not found')

      setApplication(app)

      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .select('address, unit, rent, landlord_id')
        .eq('id', app.property_id)
        .single()
      if (propErr) return setError('Property not found')
      setProperty(prop)

      const { data: itemsData } = await supabase
        .from('application_items')
        .select('*')
        .eq('application_id', appId)
      setItems(itemsData || [])

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', appId)
      setDocuments(docsData || [])

      setLoading(false)
    }
    fetch()
  }, [appId])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href="/dashboard/applications" style={{ color: '#2563eb', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to Applications</Link>
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem' }}>Application Details</h1>
          <button
            onClick={async () => {
              const stream = await renderToStream(<ApplicationPDF application={{ name: '', email: '', phone: '' }} property={property} items={items} documents={documents} />)
              const chunks: any[] = []
              for await (const chunk of stream) {
                chunks.push(chunk)
              }
              const blob = new Blob(chunks, { type: 'application/pdf' })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
            }}
            style={{ display: 'inline-flex', alignItems: 'center', background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            <Download size={16} style={{ marginRight: '0.25rem' }} />Download PDF
          </button>
          <Link href={`/dashboard/tenant/deficiencies/${appId}`} style={{ marginLeft: '0.5rem', background: '#ff8c00', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', textDecoration: 'none' }}>Report Issue</Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Property</h2>
          <p>{property?.address}{property?.unit ? `, ${property.unit}` : ''}</p>
          {property?.rent && <p>Rent: ${property.rent}</p>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Status</h2>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: application?.status === 'complete' ? '#ecfdf5' : '#eff6ff', color: application?.status === 'complete' ? '#10b981' : '#2563eb' }}>
            {application?.status}
          </span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Checklist Items</h2>
          {items.length === 0 ? <p>No items.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {items.map(item => (
                <li key={item.id} style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
                  <strong>{item.category}:</strong> {item.item_text}
                  <div style={{ marginTop: '0.25rem', color: '#555' }}>
                    Condition: {item.condition || '—'} | Notes: {item.notes || '—'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Uploaded Documents</h2>
          {documents.length === 0 ? <p>No documents.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {documents.map(doc => (
                <li key={doc.id} style={{ marginBottom: '0.5rem' }}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{doc.type}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}