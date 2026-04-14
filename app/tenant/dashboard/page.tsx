'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function TenantDashboard() {
  const router = useRouter()
  const [tenant, setTenant] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  // State for payment type selection (one-time rent or recurring subscription)
  const [paymentType, setPaymentType] = useState<'rent' | 'rent_subscription'>('rent_subscription'); // Default to recurring
  
  const [issues, setIssues] = useState<any[]>([])
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueForm, setIssueForm] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState<string | null>(null) // Use string to indicate loading step/type
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check if tenant is logged in
    const tenantData = localStorage.getItem('tenant')
    const propertyData = localStorage.getItem('property')
    
    if (!tenantData) {
      router.push('/tenant/login')
      return
    }
    
    setTenant(JSON.parse(tenantData))
    setProperty(JSON.parse(propertyData || '{}'))
  }, [router])

  // Effect to handle loading state after tenant/property data is set
  useEffect(() => {
    // No specific action needed here if loading is controlled by button clicks
    // but useful if there were initial data fetches after login.
  }, [tenant]);


  const handleLogout = () => {
    localStorage.removeItem('tenant')
    localStorage.removeItem('property')
    router.push('/tenant/login')
  }

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/tenants/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          propertyId: property.id,
          title: issueForm.title,
          description: issueForm.description
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit issue');
      }
      
      setIssueForm({ title: '', description: '' })
      setShowIssueForm(false)
      alert('Issue reported successfully!')
      // Optionally refetch issues here
    } catch (err: any) {
      alert(`Failed to submit issue: ${err.message}`)
    }
    
    setSubmitting(false)
  }

  if (loading && loading !== 'pay-rent' && loading !== 'Processing Subscription...' && loading !== 'Processing One-Time Payment...') {
     // Show generic loading if not related to payment processing
     return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-green-600">TenantKit</h1>
            <p className="text-sm text-gray-600">Welcome, {tenant?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Property Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Property</h2>
          <p className="text-2xl font-bold text-gray-900">{property?.address}</p>
          {property?.rent && (
            <p className="text-green-600 font-semibold mt-1">${property.rent}/month</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pay Rent */}
          {tenant?.rentEnabled && property?.rent ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Pay Rent</h3>
              <p className="text-gray-600 mb-4">Choose your payment preference:</p>

              {/* Payment Type Selection */}
              <div className="mb-4 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="rent_subscription"
                    checked={paymentType === 'rent_subscription'}
                    onChange={(e) => setPaymentType(e.target.value as 'rent' | 'rent_subscription')}
                    className="form-radio text-blue-600"
                  />
                  <span className="text-gray-700">Recurring Payment (${property?.rent}/month)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="rent"
                    checked={paymentType === 'rent'}
                    onChange={(e) => setPaymentType(e.target.value as 'rent' | 'rent_subscription')}
                    className="form-radio text-blue-600"
                  />
                  <span className="text-gray-700">One-time Payment (${property?.rent})</span>
                </label>
              </div>

              <button 
                onClick={async () => {
                  const actionType = paymentType === 'rent_subscription' ? 'Processing Subscription...' : 'Processing One-Time Payment...';
                  setLoading(actionType); 

                  try {
                    if (!stripePromise) {
                      throw new Error('Stripe not initialized.');
                    }

                    if (!tenant || !property || !property.rent) {
                      throw new Error('Missing tenant or property information.');
                    }

                    let apiUrl;
                    let apiBody;

                    if (paymentType === 'rent_subscription') {
                      apiUrl = '/api/create-stripe-subscription';
                      apiBody = { 
                        tenantId: tenant.id, // Pass internal tenant ID for customer lookup
                        propertyId: property.id,
                        email: tenant.email, 
                        amount: property.rent * 100, // amount in cents
                        description: `Recurring Rent for ${property.address}`,
                        paymentType: 'rent_subscription'
                      };
                    } else { // One-time payment
                      apiUrl = '/api/create-checkout-session'; // Your existing endpoint for one-time
                      apiBody = { 
                        email: tenant.email, 
                        amount: property.rent * 100, // amount in cents
                        description: `Rent Payment for ${property.address}`,
                        paymentType: 'rent' // Mark as one-time rent payment
                      };
                    }

                    const res = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json'},
                      body: JSON.stringify(apiBody)
                    });

                    const data = await res.json();
                    if (!res.ok) {
                       // Attempt to parse error message from response if available
                       const errorMessage = data?.error || `Failed to initiate ${paymentType}.`;
                       throw new Error(errorMessage);
                    }

                    const { sessionId } = data; // Expects sessionId from both endpoints
                    const stripe = await stripePromise;
                    await stripe?.redirectToCheckout({ sessionId });

                  } catch (error: any) {
                    console.error('Error initiating payment:', error);
                    alert(`Failed to initiate payment. Please try again later. Error: ${error.message}`);
                  } finally {
                    setLoading(null); // Reset loading state
                  }
                }}
                disabled={!stripePromise || loading === 'Processing Subscription...' || loading === 'Processing One-Time Payment...'}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
              >
                {loading === 'Processing Subscription...' ? 'Processing Subscription...' : 
                 loading === 'Processing One-Time Payment...' ? 'Processing One-Time Payment...' : 
                 `Proceed with ${paymentType === 'rent_subscription' ? 'Subscription' : 'One-time Payment'}`}
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-500 mb-2">Pay Rent</h3>
              <p className="text-sm text-gray-400">{tenant?.rentEnabled ? 'Rent amount not set or landlord has disabled payments.' : 'Rent payments not enabled by landlord.'}</p>
            </div>
          )}

          {/* Report Issue */}
          {tenant?.maintenanceEnabled ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Report an Issue</h3>
              <p className="text-gray-600 mb-4">Submit a maintenance request</p>
              <button 
                onClick={() => setShowIssueForm(!showIssueForm)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Report Issue
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-500 mb-2">Report Issue</h3>
              <p className="text-sm text-gray-400">Maintenance requests not enabled by landlord</p>
            </div>
          )}
        </div>

        {/* Issue Form */}
        {showIssueForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">New Maintenance Request</h3>
            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={issueForm.title}
                  onChange={e => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="e.g., Leaky faucet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={issueForm.description}
                  onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}