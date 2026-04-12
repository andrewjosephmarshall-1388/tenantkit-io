import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, tenantName, tenantEmail, tenantPhone, landlordEmail, propertyAddress, items, formResponses } = body
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    // Update the application status AND tenant info
    const appRes = await fetch(
      `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'complete',
          tenant_name: tenantName,
          tenant_email: tenantEmail,
          tenant_phone: tenantPhone
        })
      }
    )
    
    if (!appRes.ok) {
      const err = await appRes.text()
      return NextResponse.json({ error: 'Failed to update application: ' + err }, { status: 500 })
    }
    
    // Save checklist items
    for (const item of items) {
      if (item.id && !item.id.includes('-placeholder')) {
        await fetch(
          `${supabaseUrl}/rest/v1/application_items?id=eq.${item.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              category: item.category,
              item_text: item.item_text,
              condition: item.condition,
              notes: item.notes
            })
          }
        )
      } else {
        await fetch(
          `${supabaseUrl}/rest/v1/application_items`,
          {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              application_id: applicationId,
              category: item.category,
              item_text: item.item_text,
              condition: item.condition,
              notes: item.notes
            })
          }
        )
      }
    }
    
    // Save custom form responses
    for (const [formId, resp] of Object.entries(formResponses as Record<string, { agreed: boolean; response: string }>)) {
      await fetch(
        `${supabaseUrl}/rest/v1/application_responses`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            application_id: applicationId,
            form_id: formId,
            agreed: resp.agreed,
            response: resp.response
          })
        }
      )
    }
    
    // Send email notification to landlord
    if (landlordEmail) {
      try {
        await fetch(`${request.nextUrl.origin}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: landlordEmail,
            subject: `New Tenant Application for ${propertyAddress || 'your property'}`,
            text: `A new tenant application has been submitted.\n\nName: ${tenantName}\nEmail: ${tenantEmail}\nPhone: ${tenantPhone}`
          })
        })
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}