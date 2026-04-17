'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { renderToStream } from '@react-pdf/renderer'
import { ApplicationPDF } from '../../../components/ApplicationPDF'

export default function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const { id: appId } = use(params)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [application, setApplication] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [uploadingReport, setUploadingReport] = useState(false)

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
      <Link href="/dashboard/applications" className="text-green-600 hover:underline inline-block mb-4">← Back to Applications</Link>
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
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            <Download size={16} style={{ marginRight: '0.25rem' }} />Download PDF
          </button>
          <label className="ml-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded cursor-pointer inline-block">
            {uploadingReport ? 'Uploading...' : 'Upload Report'}
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingReport(true)
                try {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('applicationId', appId)
                  const res = await fetch('/api/landlord/upload-report', {
                    method: 'POST',
                    body: formData
                  })
                  const data = await res.json()
                  if (data.url) {
                    setApplication((prev: any) => ({ ...prev, inspection_report_url: data.url }))
                  } else {
                    setError(data.error || 'Upload failed')
                  }
                } catch (err) {
                  setError('Upload failed')
                }
                setUploadingReport(false)
              }}
            />
          </label>
          <Link href={`/dashboard/tenant/inspection/${appId}`} className="ml-2 bg-orange-600 hover:bg-orange-700 text-white py-1 px-2 rounded">Tenant Inspection</Link>
          <Link href={`/dashboard/landlord/inspection/${appId}`} className="ml-2 bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded">
            {application?.landlord_inspection_completed ? '✓' : ''} Landlord Inspection
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Property</h2>
          <p>{property?.address}{property?.unit ? `, ${property.unit}` : ''}</p>
          {property?.rent && <p>Rent: ${property.rent}</p>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Status</h2>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: application?.status === 'complete' ? '#ecfdf5' : '#eff6ff', color: application?.status === 'complete' ? '#10b981' : '#10b981' }}>
            {application?.status}
          </span>
        </div>

        {application?.inspection_report_url && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Inspection Report</h2>
            <a href={application.inspection_report_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
              <FileText size={16} /> View Report
            </a>
          </div>
        )}

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
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{doc.type}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}