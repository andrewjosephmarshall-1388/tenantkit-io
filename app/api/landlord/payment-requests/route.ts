import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const { userId, propertyId, tenantEmail, tenantName, amount, dueDate } = body;

    // Get landlord info
    const { data: landlord, error: landlordError } = await supabase
      .from('landlords')
      .select('id, stripe_connected_account_id')
      .eq('user_id', userId)
      .single();

    if (landlordError || !landlord) {
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
    }

    if (!landlord.stripe_connected_account_id) {
      return NextResponse.json({ error: 'Stripe account not connected' }, { status: 400 });
    }

    // Create Stripe payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Rent Payment',
            description: `Rent payment for property`,
          },
          unit_amount: amount * 100, // Convert dollars to cents
        },
        quantity: 1,
      }],
      metadata: {
        property_id: propertyId,
        landlord_id: landlord.id,
      },
    });

    // Save payment request to database
    const { data: paymentRequest, error: dbError } = await supabase
      .from('payment_requests')
      .insert({
        landlord_id: landlord.id,
        property_id: propertyId,
        tenant_email: tenantEmail,
        tenant_name: tenantName,
        amount: amount * 100, // Store in cents
        due_date: dueDate,
        status: 'pending',
        stripe_payment_link: paymentLink.url,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      paymentLink: paymentLink.url,
      paymentRequest 
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}