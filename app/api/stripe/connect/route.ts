import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export async function POST(request: NextRequest) {
  const { userId } = await request.json(); // Assuming userId is passed to identify the landlord in your DB

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server environment variables missing.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check if landlord already has a Stripe Connect account linked
    const { data: landlordData, error: dbError } = await supabase
      .from('landlords') // Assuming you have a 'landlords' table or similar
      .select('stripe_connected_account_id')
      .eq('user_id', userId) // Link to your auth user ID
      .single();

    if (dbError) {
      console.error('Error fetching landlord data:', dbError);
      return NextResponse.json({ error: 'Failed to retrieve landlord information.' }, { status: 500 });
    }

    if (landlordData?.stripe_connected_account_id) {
      // Account already exists, maybe send them to their Stripe dashboard or confirm it
      return NextResponse.json({ message: 'Stripe account already linked.', accountId: landlordData.stripe_connected_account_id });
    }

    // 2. Create a Stripe Express account
    // Express accounts are a good balance between platform control and user experience
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Or dynamically set based on landlord's country
      email: landlordData?.email || `${userId}@example.com`, // Use landlord's email or a placeholder
      capabilities: {
        // Define capabilities needed: card payments, bank transfers, etc.
        card_payments: { requested: true },
        transfers: { requested: true },
        // Add other capabilities as needed, e.g., for ACH
        us_bank_account_verification: { requested: true },
      },
      // Optional: metadata to link back to your user ID
      metadata: {
        internal_user_id: userId,
      },
    });

    // 3. Create an onboarding link for the Express account
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/settings?stripe_error=true`, // URL to redirect to if refresh is needed
      return_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/settings?stripe_account_created=true&account_id=${account.id}`, // URL to redirect to after onboarding
      type: 'account_onboarding',
      // For Express, you typically use 'account_onboarding'
    });

    // 4. Save the connected account ID to your database
    const { error: updateError } = await supabase
      .from('landlords') // Adjust table name as needed
      .update({ stripe_connected_account_id: account.id })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error saving Stripe Connected Account ID:', updateError);
      // Attempt to delete the Stripe account if DB save fails to keep things clean
      await stripe.accounts.del(account.id);
      return NextResponse.json({ error: 'Failed to save Stripe account information.' }, { status: 500 });
    }

    // 5. Return the onboarding link to the frontend
    return NextResponse.json({ url: accountLink.url, accountId: account.id });

  } catch (error: any) {
    console.error('Stripe Connect Error:', error);
    return NextResponse.json({ error: `Failed to set up Stripe Connect: ${error.message}` }, { status: 500 });
  }
}