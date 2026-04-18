import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the expected event types we are handling
const relevantEvent = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  // Add more events if necessary, e.g., for account updates
]);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Stripe webhook signature or secret missing.');
    return NextResponse.json({ error: 'Webhook secret or signature missing.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed. error: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  // Handle the event
  if (relevantEvent.has(event.type)) {
    console.log(`Stripe event received: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
          
          // Check metadata to differentiate payment types
          const paymentType = checkoutSessionCompleted.metadata?.paymentType;
          const sessionId = checkoutSessionCompleted.id;
          const amountReceived = checkoutSessionCompleted.amount_total; // In cents

          if (paymentType === 'background_check') {
            console.log('Handling completed checkout session for background check...');
            const applicationId = checkoutSessionCompleted.metadata?.applicationId;
            
            if (applicationId) {
                 // Update Supabase: Mark background check as paid for this application.
                 const { error } = await supabase
                   .from('applications') // Assuming your applications table is named 'applications'
                   .update({ 
                     background_check_paid: true, 
                     background_check_payment_session_id: sessionId 
                   })
                   .eq('id', applicationId);
                 
                 if (error) {
                   console.error(`Error updating application ${applicationId} for background check payment:`, error);
                 } else {
                   console.log(`Successfully updated application ${applicationId} for background check payment.`);
                 }
            } else {
                console.warn('Background check payment completed, but no applicationId found in metadata.');
            }
            
          } else if (paymentType === 'rent' || paymentType === 'rent_subscription') {
             // This event handles the FIRST payment for a subscription OR a one-time rent payment.
            console.log(`Handling completed checkout session for rent payment (Type: ${paymentType})...`);
            const tenantId = checkoutSessionCompleted.metadata?.tenantId;
            const propertyId = checkoutSessionCompleted.metadata?.propertyId;
            
            if (tenantId && propertyId && amountReceived !== null) {
              // Record the one-time rent payment or initial subscription payment.
              const { error } = await supabase.from('rent_payments').insert({
                tenant_id: tenantId,
                property_id: propertyId, 
                amount: amountReceived / 100, // Convert cents to dollars
                due_date: new Date(), // Placeholder: Determine actual due date properly
                paid_at: new Date(),
                status: 'paid',
                stripe_checkout_session_id: sessionId,
              });
              
              if (error) {
                console.error(`Error recording rent payment for tenant ${tenantId}:`, error);
              } else {
                console.log(`Successfully recorded rent payment for tenant ${tenantId}.`);
              }
            } else {
                console.warn('Rent payment completed, but missing tenantId, propertyId, or amount in metadata/session.');
            }
          } else {
              console.log(`Checkout session completed with unknown paymentType: ${paymentType}. Session ID: ${sessionId}`);
          }
          break;

        case 'invoice.payment_succeeded':
          // This event signifies a successful recurring/subscription payment.
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription as string;
          const stripeCustomerId = invoice.customer as string;
          const amountPaid = invoice.amount_paid; // In cents

          if (subscriptionId && stripeCustomerId && amountPaid !== null) {
            console.log(`Recurring payment succeeded for subscription ${subscriptionId}. Amount: ${amountPaid}`);
            
            // Update tenant's subscription status in our DB
            const { data: tenantData, error: tenantErr } = await supabase
              .from('tenants')
              .select('id')
              .eq('stripe_customer_id', stripeCustomerId)
              .single();

            if (tenantData && !tenantErr) {
              const { error: updateSubError } = await supabase
                .from('tenants')
                .update({ 
                  stripe_subscription_id: subscriptionId, // Ensure this is up-to-date
                  is_subscribed: true, // Mark as subscribed
                  // Could also update a 'last_rent_paid_at' timestamp here
                })
                .eq('id', tenantData.id);
              
              if (updateSubError) {
                console.error(`Error updating tenant ${tenantData.id} with subscription ${subscriptionId}:`, updateSubError);
              } else {
                console.log(`Successfully updated tenant ${tenantData.id} with subscription ${subscriptionId}.`);
              }
            } else {
              console.warn(`Could not find tenant for Stripe Customer ID: ${stripeCustomerId} to update subscription.`);
            }
          }
          break;

        case 'customer.subscription.created':
          const subscriptionCreated = event.data.object as Stripe.Subscription;
          const newSubscriptionId = subscriptionCreated.id;
          const stripeCustIdSubCreated = subscriptionCreated.customer as string;
          const tenantInternalIdSubCreated = subscriptionCreated.metadata?.internal_tenant_id; 

          if (newSubscriptionId && stripeCustIdSubCreated) {
            console.log(`Stripe subscription created: ${newSubscriptionId}`);
            
            if (tenantInternalIdSubCreated) {
              await supabase.from('tenants').update({ 
                stripe_subscription_id: newSubscriptionId,
                is_subscribed: true 
              }).eq('id', tenantInternalIdSubCreated);
            } else {
              // Fallback: Find tenant by stripe_customer_id
              const { data: tenantData, error: tenantErr } = await supabase.from('tenants').select('id').eq('stripe_customer_id', stripeCustIdSubCreated).single();
              if (tenantData && !tenantErr) {
                await supabase.from('tenants').update({ 
                  stripe_subscription_id: newSubscriptionId,
                  is_subscribed: true 
                }).eq('id', tenantData.id);
              } else {
                console.warn(`Could not find tenant for Stripe Customer ID: ${stripeCustIdSubCreated} to update subscription creation.`);
              }
            }
          }
          break;

        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          console.log(`Stripe subscription updated: ${subscriptionUpdated.id} Status: ${subscriptionUpdated.status}`);
          const stripeCustIdSubUpdated = subscriptionUpdated.customer as string;
          const internalTenantIdSubUpdated = subscriptionUpdated.metadata?.internal_tenant_id; 
          
          // Update subscription status based on Stripe's status
          const newStatus = subscriptionUpdated.status; // e.g., 'active', 'canceled', 'past_due', 'incomplete'
          let isSubscribed = false;
          if (newStatus === 'active') {
            isSubscribed = true;
          }
          
          if (internalTenantIdSubUpdated) {
             await supabase.from('tenants').update({
               stripe_subscription_id: subscriptionUpdated.id, // Update ID in case it changed (rare)
               is_subscribed: isSubscribed,
               subscription_status: newStatus // Store Stripe's status for reference
             }).eq('id', internalTenantIdSubUpdated);
          } else {
             const { data: tenantData, error: tenantErr } = await supabase.from('tenants').select('id').eq('stripe_customer_id', stripeCustIdSubUpdated).single();
             if (tenantData && !tenantErr) {
               await supabase.from('tenants').update({
                 stripe_subscription_id: subscriptionUpdated.id,
                 is_subscribed: isSubscribed,
                 subscription_status: newStatus
               }).eq('id', tenantData.id);
             } else {
               console.warn(`Could not find tenant for Stripe Customer ID: ${stripeCustIdSubUpdated} to update subscription status.`);
             }
          }
          break;
          
        case 'customer.subscription.deleted':
          const subscriptionDeleted = event.data.object as Stripe.Subscription;
          console.log(`Stripe subscription deleted: ${subscriptionDeleted.id}`);
          const stripeCustIdSubDeleted = subscriptionDeleted.customer as string;
          const internalTenantIdSubDeleted = subscriptionDeleted.metadata?.internal_tenant_id; 

          // Mark subscription as inactive/null in our DB
          if (internalTenantIdSubDeleted) {
             await supabase.from('tenants').update({
               stripe_subscription_id: null, 
               is_subscribed: false
             }).eq('id', internalTenantIdSubDeleted);
          } else {
             const { data: tenantData, error: tenantErr } = await supabase.from('tenants').select('id').eq('stripe_customer_id', stripeCustIdSubDeleted).single();
             if (tenantData && !tenantErr) {
               await supabase.from('tenants').update({
                 stripe_subscription_id: null,
                 is_subscribed: false
               }).eq('id', tenantData.id);
             } else {
               console.warn(`Could not find tenant for Stripe Customer ID: ${stripeCustIdSubDeleted} to update deleted subscription.`);
             }
          }
          break;

        case 'payment_intent.succeeded':
          const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
          console.log(`PaymentIntent was successful: ${paymentIntentSucceeded.id}`);
          // If you are using PaymentIntents directly (less common with Checkout Sessions)
          // you'd update your DB here. Amount is paymentIntentSucceeded.amount
          // Link to customer: paymentIntentSucceeded.customer
          break;
          
        case 'payment_intent.payment_failed':
           const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
           console.error(`PaymentIntent failed: ${paymentIntentFailed.id}`);
           // Handle failed payment intent (e.g., notify user, update status in DB)
           // You can get the customer ID from paymentIntentFailed.customer
           break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Error handling event ${event.type}:`, error);
      // Return a 500 error to Stripe so it can retry the webhook
      return NextResponse.json({ received: false, error: 'Internal server error processing webhook' }, { status: 500 });
    }
  } else {
    console.log(`Ignoring irrelevant event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
