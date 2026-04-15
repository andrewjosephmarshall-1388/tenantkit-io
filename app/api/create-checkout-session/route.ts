import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia', // Use the latest stable API version
  typescript: true,
});

export async function POST(request: NextRequest) {
  const { email, amount, description, metadata } = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server environment variables missing.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // If it's a background check, we'll need its ID to link it later.
    // For rent, we might link it to a subscription or a rent payment record.
    let stripeMetadata = metadata || {};
    if (metadata?.type === 'background_check') {
      stripeMetadata.applicationId = metadata.applicationId;
    } else if (metadata?.type === 'rent') {
      // Add any rent-specific metadata if needed
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // For now, let's focus on card payments for simplicity
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
            },
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: metadata?.type === 'background_check'
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}&status=success&payment_type=background_check`
        : `${process.env.NEXT_PUBLIC_FRONTEND_URL}/tenant/dashboard?session_id={CHECKOUT_SESSION_ID}&status=success&payment_type=rent`, // Adjust success URL based on payment type
      cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/tenant/dashboard?status=cancelled`, // Or redirect to application page if cancelled
      customer_email: email,
      metadata: stripeMetadata, // Pass metadata to Stripe session
      // Payout logic will be handled separately or via webhooks
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    return NextResponse.json({ error: `Failed to create checkout session: ${error.message}` }, { status: 500 });
  }
}