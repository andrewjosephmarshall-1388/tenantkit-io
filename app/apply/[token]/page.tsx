'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export default function TenantApplication() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

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

  // Fetch application & property based on token via API
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token')
      setLoading(false)
      return
    }
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/application/${token}`)
        const data = await res.json()
        
        if (data.error) {
          return setError(data.error || 'Invalid or expired link')
        }
        
        setApplicationId(data.application.id)
        setProperty(data.property)
        setLandlordEmail(data.landlordEmail)
        setCustomForms(data.customForms || [])
        
        // Set items - use existing or default
        if (data.items && data.items.length > 0) {
          setItems(data.items)
        } else {
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
      } catch (err: any) {
        setError(err.message || 'Failed to load application')
      }
      setLoading(false)
    }
    fetchData()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Submit application via API
      const res = await fetch('/api/application/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          tenantName: form.name,
          tenantEmail: form.email,
          tenantPhone: form.phone,
          landlordEmail,
          propertyAddress: property?.address,
          items,
          formResponses,
          idFileName: idFile?.name,
          incomeFileName: incomeFile?.name
        })
      })
      const result = await res.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      router.push('/thank-you')
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit application')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tenant Application</h1>
      {property && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <p className="font-semibold">Property: {property.address}</p>
          {property.city || property.state ? (
            <p className="text-sm text-gray-600">{property.city}{property.state ? `, ${property.state}` : ''} {property.zip || ''}</p>
          ) : null}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Full Name</label>
          <input
            type="text"
            required
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            required
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input
            type="tel"
            required
            className="w-full border p-2 rounded"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* File uploads (optional) */}
        <div>
          <label className="block font-medium">ID Document (optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setIdFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Proof of Income (optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setIncomeFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        {/* Custom forms */}
        {customForms.map(form => (
          <div key={form.id} className="border p-4 rounded">
            <h3 className="font-bold">{form.title}</h3>
            <p className="text-sm mb-2">{form.description}</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={e => setFormResponses(prev => ({
                  ...prev,
                  [form.id]: { ...prev[form.id], agreed: e.target.checked }
                }))}
              />
              <span>I agree to the terms above</span>
            </label>
            {form.include_notes && (
              <textarea
                placeholder="Additional notes..."
                className="w-full border p-2 mt-2"
                onChange={e => setFormResponses(prev => ({
                  ...prev,
                  [form.id]: { ...prev[form.id], response: e.target.value }
                }))}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}