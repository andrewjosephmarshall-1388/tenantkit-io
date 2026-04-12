import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    // Fetch application by token
    const appRes = await fetch(
      `${supabaseUrl}/rest/v1/applications?token=eq.${token}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const applications = await appRes.json()
    
    if (!applications || applications.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }
    
    const application = applications[0]
    
    // Fetch property
    const propRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${application.property_id}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const properties = await propRes.json()
    
    if (!properties || properties.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    const property = properties[0]
    
    // Fetch landlord info
    let landlordEmail = ''
    if (property.landlord_id) {
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${property.landlord_id}&select=email,maintenance_email`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      )
      const users = await userRes.json()
      if (users && users.length > 0) {
        landlordEmail = users[0].maintenance_email || users[0].email
      }
    }
    
    // Fetch custom forms
    const formsRes = await fetch(
      `${supabaseUrl}/rest/v1/property_forms?property_id=eq.${property.id}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const customForms = await formsRes.json()
    
    // Fetch application items
    const itemsRes = await fetch(
      `${supabaseUrl}/rest/v1/application_items?application_id=eq.${application.id}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const items = await itemsRes.json()
    
    return NextResponse.json({
      application,
      property,
      landlordEmail,
      customForms: customForms || [],
      items: items || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}