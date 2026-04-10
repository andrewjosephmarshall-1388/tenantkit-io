'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function TenantApplication({ params }: { params: { token: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const token = params.token

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [property, setProperty] = useState<any>(null)
  const [applicationId, setApplicationId] = useState<string>('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [idFile, setIdFile] = useState<File | null>(null)
  const [incomeFile, setIncomeFile] = useState<File | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [landlordEmail, setLandlordEmail] = useState('')
  const [customForms, setCustomForms] = useState<any[]>([])
  const [formResponses, setFormResponses] = useState<{ [formId: string]: { agreed: boolean; response: string } }>({})

  // Fetch application & property based on token
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .select('id, property_id')
        .eq('token', token)
        .single()
      if (appErr) return setError('Invalid or expired link')
      setApplicationId(app.id)
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .select('*, property_forms')
        .eq('id', app.property_id)
        .single()
      if (propErr) return setError('Property not found')
      setProperty(prop)
      // fetch landlord email
      if (prop.landlord_id) {
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', prop.landlord_id)
          .single()
        if (user) setLandlordEmail(user.email)
      }

      // Load custom forms for this property
      const { data: forms } = await supabase
        .from('property_forms')
        .select('*')
        .eq('property_id', prop.id)
      if (forms) setCustomForms(forms)

      // Load any pre‑created checklist items for this application (if none, fall back to a static set)
      const { data: existingItems, error: itemsErr } = await supabase
        .from('application_items')
        .select('*')
        .eq('application_id', app.id)
      if (!itemsErr && existingItems && existingItems.length) {
        setItems(existingItems)
      } else {
        // static fallback checklist (primary categories)
        const defaultCategories = [
          'Structural & Exterior Systems',
          'Exterior',
          'Roof',
          'Basement, Foundation, Crawlspace & Structure',
          'Attic, Insulation & Ventilation',
          'Mechanical & Utility Systems',
          'Heating & Cooling',
          'Plumbing',
          'Electrical',
          'Interior & Specialized Areas',
          'Doors, Windows & Interior',
          'Built-in Appliances',
          'Garage',
          'Fireplace'
        ]
        const placeholder = defaultCategories.map(cat => ({
          id: uuidv4(),
          category: cat,
          item_text: '(placeholder)',
          condition: '',
          notes: ''
        }))
        setItems(placeholder)
      }
      setLoading(false)
    }
    fetch()
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    setItems(updated)
  }

  const uploadFile = async (file: File, type: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const { error: uploadErr } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, file)
    if (uploadErr) throw uploadErr
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${fileName}`
    await supabase.from('documents').insert({
      application_id: applicationId,
      type,
      url: publicUrl
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1️⃣ Upload ID & income docs if provided
      if (idFile) await uploadFile(idFile, 'photo_id')
      if (incomeFile) await uploadFile(incomeFile, 'income_proof')

      // 2️⃣ Upsert checklist items
      for (const item of items) {
        const { data, error } = await supabase.from('application_items').upsert({
          id: item.id,
          application_id: applicationId,
          category: item.category,
          item_text: item.item_text,
          condition: item.condition,
          notes: item.notes
        })
        if (error) console.error('Item upsert error', error)
      }

      // 3️⃣ Save custom form responses
      for (const form of customForms) {
        const resp = formResponses[form.id] || { agreed: false, response: '' }
        await supabase.from('form_responses').insert({
          application_id: applicationId,
          form_id: form.id,
          agreed: resp.agreed,
          response: resp.response,
        })
      }

      // 4️⃣ Mark application as complete
      await supabase.from('applications').update({ status: 'complete' }).eq('id', applicationId)

      // 4️⃣ Notify landlord (reuse existing email route) – simple fire‑and‑forget
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: landlordEmail,
          subject: 'New rental application submitted',
          text: `A tenant (${form.name}) has submitted their application for ${property?.address}`
        })
      })

      router.push('/thank-you')
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (error) return <div style={{ color: '#B91C1C', padding: '2rem' }}>{error}</div>

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rental Application for {property?.address}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }} />
        <label>Photo ID (optional)</label>
        <input type="file" accept="image/*" onChange={e => setIdFile(e.target.files?.[0] ?? null)} />
        <label>Proof of Income (optional)</label>
        <input type="file" accept="image/*,application/pdf" onChange={e => setIncomeFile(e.target.files?.[0] ?? null)} />
        <h3 style={{ marginTop: '1.5rem' }}>Custom Forms</h3>
        {customForms.length === 0 ? <p>No custom forms for this property.</p> : customForms.map(form => (
          <div key={form.id} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <a href={form.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', marginRight: '0.5rem' }}>{form.name}</a>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
              <input type="checkbox" checked={formResponses[form.id]?.agreed || false} onChange={e => setFormResponses(prev => ({ ...prev, [form.id]: { ...prev[form.id], agreed: e.target.checked } }))} />
              <span style={{ marginLeft: '0.25rem' }}>I have read and agree to this form</span>
            </label>
            <textarea placeholder="Your response / signature (optional)" value={formResponses[form.id]?.response || ''} onChange={e => setFormResponses(prev => ({ ...prev, [form.id]: { ...prev[form.id], response: e.target.value } }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }} />
          </div>
        ))}
        <h3 style={{ marginTop: '1.5rem' }}>Move‑in Checklist</h3>
        {items.map((item, idx) => (
          <div key={item.id} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
            <strong>{item.category}</strong>: {item.item_text}
            <div style={{ marginTop: '0.5rem' }}>
              <select value={item.condition || ''} onChange={e => handleItemChange(idx, 'condition', e.target.value)} style={{ marginRight: '0.5rem' }}>
                <option value="">Condition</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="n/a">N/A</option>
              </select>
              <input type="text" placeholder="Notes" value={item.notes || ''} onChange={e => handleItemChange(idx, 'notes', e.target.value)} style={{ width: '60%' }} />
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
