'use client'
'use dynamic'
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
        // Set items – use existing or placeholder defaults
        if (data.items && data.items.length > 0) {
          setItems(data.items)
        } else {
          const defaultCategories = [
            'Structural & Exterior Systems', 'Exterior', 'Roof',
            'Basement, Foundation, Crawlspace & Structure',
            'Attic, Insulation & Ventilation', 'Mechanical & Utility Systems',
            'Heating & Cooling', 'Plumbing', 'Electrical',
            'Interior & Specialized Areas', 'Doors, Windows & Interior',
            'Built-in Appliances', 'Garage', 'Fireplace'
          ]
          setItems(defaultCategories.map(cat => ({
            id: uuidv4(),
            category: cat,
            item_text: '(placeholder)',
            condition: '',
            notes: ''
          })))
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
      if (result.error) throw new Error(result.error)
      router.push('/thank-you')
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit application')
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl text-gray-600">Loading…</div>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl text-red-600">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-4">
          {property ? `Apply for ${property.address}` : 'Tenant Application'}
        </h1>
        {/* Happy landlord handing keys */}
        <img src="https://images.unsplash.com/photo-1520541414399-1ff0b9f5936f?auto=format&fit=crop&w=800&q=80" alt="Landlord handing keys" className="w-full rounded-md mb-6" />
        {property && (
          <p className="text-center text-gray-600 mb-6">
            {property.city ? `${property.city}, ${property.state || ''}` : ''}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Document (optional)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full"
              onChange={e => setIdFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Income (optional)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full"
              onChange={e => setIncomeFile(e.target.files?.[0] || null)}
            />
          </div>
          {/* Custom Forms */}
          {customForms.map(form => (
            <div key={form.id} className="border border-gray-200 rounded-md p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{form.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{form.description}</p>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 border-gray-300 rounded"
                  onChange={e => setFormResponses(prev => ({
                    ...prev,
                    [form.id]: { ...prev[form.id], agreed: e.target.checked }
                  }))}
                />
                <span className="text-sm text-gray-700">I agree to the terms above</span>
              </label>
              {form.include_notes && (
                <textarea
                  placeholder="Additional notes..."
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={3}
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
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-md transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}
