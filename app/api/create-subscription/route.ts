import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { email, priceId } = await req.json();
  if (!email || !priceId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  // Create (or retrieve) a customer in Stripe
  const { data: existing } = await stripe.customers.list({ email, limit: 1 });
  const customer = existing.length ? existing[0] : await stripe.customers.create({ email });

  // Create a Checkout Session for subscription
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    metadata: { email },
  });

  // Store the checkout session id for later verification
  const supabase = createClient();
  await supabase.from('stripe_sessions').insert({
    email,
    session_id: session.id,
    customer_id: customer.id,
    price_id: priceId,
  });

  return NextResponse.json({ url: session.url });
}
