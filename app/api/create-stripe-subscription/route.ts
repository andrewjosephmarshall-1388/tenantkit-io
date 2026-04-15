import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

// Supabase client for fetching tenant/property data and storing Stripe customer/subscription IDs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get or create a Stripe Customer
async function getOrCreateStripeCustomer(email: string, tenantInternalId: string) {
  // First, check if a Stripe customer ID is already linked to the tenant in Supabase
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants') // Assuming tenants table has stripe_customer_id
    .select('stripe_customer_id')
    .eq('id', tenantInternalId) 
    .single();

  if (tenantError && tenantError.code !== 'PGRST116') { // Ignore '0 rows' error if not found
    console.error('Error fetching tenant Stripe customer ID:', tenantError);
    throw new Error('Failed to retrieve tenant Stripe data.');
  }

  if (tenantData?.stripe_customer_id) {
    try {
      // Fetch customer from Stripe to ensure it exists and is valid
      await stripe.customers.retrieve(tenantData.stripe_customer_id);
      return tenantData.stripe_customer_id;
    } catch (stripeError: any) {
      // If customer doesn't exist on Stripe's side (e.g., deleted), recreate it
      if (stripeError.type === 'StripeInvalidRequestError' && stripeError.code === 'resource_missing') {
        console.warn(`Stripe customer ${tenantData.stripe_customer_id} not found, recreating.`);
      } else {
        console.error('Error retrieving Stripe customer:', stripeError);
        throw new Error('Failed to retrieve Stripe customer.');
      }
    }
  }

  // Create a new Stripe customer if not found or invalid
  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        internal_tenant_id: tenantInternalId, // Link to your internal tenant ID
      },
    });

    // Save the new Stripe customer ID back to your Supabase database
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ stripe_customer_id: customer.id })
      .eq('id', tenantInternalId);

    if (updateError) {
      console.error('Error saving new Stripe customer ID:', updateError);
      throw new Error('Failed to save new Stripe customer ID.');
    }
    return customer.id;
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer.');
  }
}

// Helper function to get or create a Stripe Price for a given amount and recurring interval
async function getOrCreateStripePrice(amountInCents: number, interval: 'day' | 'week' | 'month' | 'year' = 'month') {
  // In a real app, you'd likely want to cache prices or have a more robust way to manage them.
  // For simplicity here, we'll search for an existing price or create one.
  // A more scalable approach might involve creating prices via the Stripe API directly and storing their IDs.

  try {
    // Search for existing prices matching the amount and interval
    const prices = await stripe.prices.list({
      recurring: { interval: interval },
      currency: 'usd',
      active: true,
      limit: 10,
    });

    // Find a price matching our amount
    const matchingPrice = prices.data.find(p => p.unit_amount === amountInCents);
    if (matchingPrice) {
      return matchingPrice.id;
    }

    // If no price found, create a new one
    // It's generally better to create products first, then prices linked to products.
    const product = await stripe.products.create({
      name: `Rent Payment (${interval})`, // Generic name, can be made more specific
      // You might want to add metadata to the product as well
      // metadata: { internal_rent_product: true }
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountInCents,
      currency: 'usd',
      recurring: { interval: interval },
    });

    return price.id;
  } catch (error: any) {
    console.error('Error getting or creating Stripe Price:', error);
    throw new Error('Failed to get or create Stripe Price.');
  }
}

export async function POST(request: NextRequest) {
  const { tenantId, propertyId, email, amount, description, paymentType } = await request.json();

  if (!tenantId || !propertyId || !email || !amount || !description || !paymentType) {
    return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
  }

  try {
    // We use tenantId to get/create Stripe Customer and manage subscriptions.
    // Email is used for communication/pre-filling Stripe details.

    // 1. Get or Create Stripe Customer
    const customerId = await getOrCreateStripeCustomer(email, tenantId);

    // 2. Handle subscription creation for recurring rent
    if (paymentType === 'rent_subscription') {
        // Amount should be in cents
        if (amount <= 0) {
            return NextResponse.json({ error: 'Rent amount must be positive.' }, { status: 400 });
        }
        const priceId = await getOrCreateStripePrice(amount, 'month'); // Assuming rent is monthly
        
        if (!priceId) {
            throw new Error("Could not determine or create Stripe Price ID for subscription.");
        }

        // Create a Stripe Checkout Session for subscription creation
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'us_bank_account'], // Allow card and ACH
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription', // This is a subscription payment
            customer: customerId, // Attach to the Stripe customer
            // Redirect URLs
            // Success URL should ideally capture session_id and handle subscription creation confirmation
            success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/tenant/dashboard?session_id={CHECKOUT_SESSION_ID}&status=success&payment_type=${paymentType}`,
            cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/tenant/dashboard?status=cancelled&payment_type=${paymentType}`, // Redirect back to tenant dashboard on cancel
            metadata: { 
                tenantId: tenantId,
                propertyId: propertyId,
                paymentType: paymentType,
                 // This metadata will be available in the Stripe Checkout Session object and can be retrieved via webhook
            }
        });

        // Return the session ID for the frontend to redirect
        return NextResponse.json({ sessionId: session.id, url: session.url });

    } else if (paymentType === 'background_check') {
        // Handle one-time payment for background check using the previous logic
        // This endpoint is primarily for subscriptions, but we can adapt if needed.
        // For now, redirect to the one-time payment endpoint for consistency or error out.
        // Let's assume the previous endpoint is still used for one-time:
         return NextResponse.json({ error: 'Use the /api/create-checkout-session endpoint for one-time payments like background checks.' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Invalid payment type specified.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Stripe Subscription Creation Error:', error);
    return NextResponse.json({ error: `Failed to create Stripe subscription: ${error.message}` }, { status: 500 });
  }
}
