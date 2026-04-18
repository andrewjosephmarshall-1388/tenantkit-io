'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Upload, FileText, Trash2 } from 'lucide-react'

export default function PropertyFormsPage() {
  const { id: propertyId } = useParams()
  const supabase = createClient()
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // fetch existing forms
  useEffect(() => {
    const fetchForms = async () => {
      const { data, error } = await supabase
        .from('property_forms')
        .select('*')
        .eq('property_id', propertyId)
      if (!error) setForms(data || [])
      setLoading(false)
    }
    fetchForms()
  }, [propertyId, supabase])

  // handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    setUploading(true)
    setError('')
    try {
      const fileName = `${propertyId}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file)
      if (uploadErr) throw uploadErr

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${fileName}`
      const { data, error: dbErr } = await supabase
        .from('property_forms')
        .insert({
          property_id: propertyId,
          name: file.name,
          url: publicUrl,
        })
        .select()
        .single()
      if (dbErr) throw dbErr

      setForms([...forms, data])
    } catch (err: any) {
      setError(err.message)
    }
    setUploading(false)
  }

  // delete form
  const deleteForm = async (formId: string) => {
    if (!confirm('Delete this form?')) return
    await supabase.from('property_forms').delete().eq('id', formId)
    setForms(forms.filter(f => f.id !== formId))
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <Link href="/dashboard/properties" className="text-green-600 hover:underline inline-block mb-4">← Back to Properties</Link>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Custom Forms for Property</h1>

      {error && <div style={{ color: '#B91C1C', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <label className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer" >
          <Upload size={16} style={{ marginRight: '0.25rem' }} />
          {uploading ? 'Uploading…' : 'Upload Form'}
          <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {forms.length === 0 ? (
        <p>No custom forms uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {forms.map(form => (
            <li key={form.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FileText size={20} className="mr-2 text-green-600" />
                <a href={form.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1f2937', textDecoration: 'none' }}>{form.name}</a>
              </div>
              <button onClick={() => deleteForm(form.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}