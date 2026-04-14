'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Assuming you have a way to get the current user's ID or tenant data
// For demonstration, we'll use a placeholder and assume it's available
// import { useAuth } from '@/lib/hooks/useAuth'; // Example hook

export default function SettingsPage() {
  const router = useRouter();
  // const { user } = useAuth(); // Get current user if using a global auth context
  // Mock user ID for now, replace with actual user ID retrieval
  const mockUserId = 'a7b3a2a1-1d1f-4d1f-8d1f-1a1a1a1a1a1a'; // Replace with actual landlord user ID

  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check initial Stripe connection status and handle redirect params
  useEffect(() => {
    setInitialLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const stripeAccountIdParam = urlParams.get('account_id');
    const stripeCreated = urlParams.get('stripe_account_created');
    const stripeError = urlParams.get('stripe_error');
    const returnUrl = '/dashboard/settings'; // Base URL for settings page

    if (stripeCreated === 'true' && stripeAccountIdParam) {
      setStripeConnected(true);
      setStripeAccountId(stripeAccountIdParam);
      alert('Stripe account successfully connected!');
      // Clean up the URL by removing query parameters related to Stripe
      router.replace(returnUrl);
    } else if (stripeError) {
      setError('There was an error connecting your Stripe account. Please try again.');
      router.replace(returnUrl); // Clean up URL
    } else {
      // Fetch existing connection status from backend if not a redirect
      // Replace with actual API call to your backend
      const fetchConnectionStatus = async () => {
        try {
           // Assuming you have an API endpoint to get landlord's settings
           const res = await fetch('/api/landlord/settings'); // Replace with your actual API endpoint
           const data = await res.json();

           if (res.ok && data.stripe_connected_account_id) {
             setStripeConnected(true);
             setStripeAccountId(data.stripe_connected_account_id);
           }
        } catch (err) {
           console.error("Failed to fetch Stripe connection status:", err);
           // Handle error appropriately, maybe set an error message on UI
        } finally {
           setInitialLoading(false);
        }
      };
      fetchConnectionStatus();
    }
    // If using a real user object, add it to dependency array
    // }, [router, user, stripeAccountIdParam, stripeCreated, stripeError]);
  }, [router]);


  const handleConnectStripe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass the actual landlord user ID here
        body: JSON.stringify({ userId: mockUserId }), 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate Stripe connection.');
      }

      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else if (data.message && data.accountId) {
        // Account already linked or message returned
        setStripeConnected(true);
        setStripeAccountId(data.accountId);
        alert(data.message); // Show user message like "Stripe account already linked."
      } else {
         throw new Error('Unexpected response from server.');
      }
    } catch (err: any) {
      console.error('Stripe connection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
       <div className="p-8">
          <p>Loading settings...</p>
       </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Payout Settings</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Connect Your Stripe Account</h3>
        {stripeConnected ? (
          <p className="text-green-600 mb-4">
            Stripe account is connected{stripeAccountId && ` (ending in ${stripeAccountId.slice(-4)})`}.
          </p>
        ) : (
          <p className="text-gray-600 mb-4">
            Connect your Stripe account to receive payouts for rent collection and other services.
          </p>
        )}

        {!stripeConnected && (
          <button 
            onClick={handleConnectStripe} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Stripe Account'}
          </button>
        )}
      </div>
    </div>
  );
}
