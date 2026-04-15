'use client'
'use dynamic'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function TenantApplication() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  // States for loading, errors, property details, tenant form, file uploads, custom forms, and background check option
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [property, setProperty] = useState<any>(null)
  const [applicationId, setApplicationId] = useState<string>('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [idFile, setIdFile] = useState<File | null>(null)
  const [incomeFile, setIncomeFile] = useState<File | null>(null)
  const [items, setItems] = useState<any[]>([]) // For property inspection items
  const [landlordEmail, setLandlordEmail] = useState('')
  const [customForms, setCustomForms] = useState<any[]>([])
  const [formResponses, setFormResponses] = useState<{ [formId: string]: { agreed: boolean; response: string } }>({})
  const [includeBackgroundCheck, setIncludeBackgroundCheck] = useState(false)

  // Fetch application & property data based on the token
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token')
      setLoading(false)
      return
    }
    const fetchData = async () => {
      setLoading(true);
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
        
        // Initialize items, using existing or placeholder defaults
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
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // Handle form submission: either background check payment or regular application submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    try {
      // --- Background Check Payment Flow ---
      if (includeBackgroundCheck) {
        if (!stripePromise) {
          throw new Error('Stripe not initialized. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.');
        }

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email, // Use tenant's email for Stripe session
            amount: 3250, // $32.50 in cents
            description: `Background Check for ${property?.address || 'Property'}`,
            metadata: {
              type: 'background_check',
              applicationId: applicationId,
              // Pass other relevant details if needed, e.g., tenant name, property ID
            }
          })
        });

        const { sessionId, url, error: stripeError } = await response.json();
        if (stripeError) {
          throw new Error(`Stripe API error: ${stripeError}`);
        }
        if (!sessionId && !url) {
          throw new Error('Failed to get Stripe session.');
        }

        // Redirect to Stripe checkout
        if (url) {
          window.location.href = url;
          return;
        }
      }

      // --- Regular Application Submission (if background check is not selected) ---
      const submitRes = await fetch('/api/application/submit', {
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
      });
      
      const result = await submitRes.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Redirect to thank you page after successful submission
      router.push('/thank-you');

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred during submission.');
      // Keep loading false to show the error message
    } finally {
      setLoading(false); // Ensure loading is set to false after all operations
    }
  };

  // Render loading state
  if (loading && !error) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-xl text-gray-600">Loading Application...</div>
    </div>
  )
  // Render error state
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-xl text-red-600 text-center p-4">{error}</div>
    </div>
  )

  // Render application form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-4">
          {property ? `Apply for ${property.address}` : 'Tenant Application'}
        </h1>
        {/* Placeholder Image - Replace with actual image asset or remove if not needed */}
        <img src="https://images.unsplash.com/photo-1520541414399-1ff0b9f5936f?auto=format&fit=crop&w=800&q=80" alt="Landlord handing keys" className="w-full rounded-md mb-6" />
        {property?.city && (
          <p className="text-center text-gray-600 mb-6">{property.city}, {property.state || ''}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Information Fields */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="phone"
              type="tel"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {/* File Uploads */}
          <div>
            <label htmlFor="id-document" className="block text-sm font-medium text-gray-700 mb-1">ID Document (optional)</label>
            <input
              id="id-document"
              type="file"
              accept="image/*,.pdf"
              className="w-full"
              onChange={e => setIdFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label htmlFor="income-proof" className="block text-sm font-medium text-gray-700 mb-1">Proof of Income (optional)</label>
            <input
              id="income-proof"
              type="file"
              accept="image/*,.pdf"
              className="w-full"
              onChange={e => setIncomeFile(e.target.files?.[0] || null)}
            />
          </div>
          {/* Background Check Option */}
          <div className="border border-blue-200 bg-blue-50 rounded-md p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBackgroundCheck}
                onChange={e => setIncludeBackgroundCheck(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded mt-0.5"
              />
              <div>
                <span className="font-medium text-gray-800">Add Background Check ($32.50)</span>
                <p className="text-sm text-gray-600">Get a credit, criminal & eviction report. Faster approval for your application.</p>
              </div>
            </label>
          </div>
          {/* Custom Form Questions */}
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
                  required={form.include_notes} // Make agreement required if there are notes
                />
                <span className="text-sm text-gray-700">I agree to the terms above</span>
              </label>
              {form.include_notes && (
                <textarea
                  placeholder="Additional notes..."
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500 mt-2"
                  rows={3}
                  onChange={e => setFormResponses(prev => ({
                    ...prev,
                    [form.id]: { ...prev[form.id], response: e.target.value }
                  }))}
                />
              )}
            </div>
          ))}
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            // Conditionally set button text based on background check and loading state
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : includeBackgroundCheck ? 'Submit Application & Pay $32.50' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}