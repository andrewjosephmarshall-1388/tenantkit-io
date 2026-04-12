import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, unit, rent, userId, security_deposit } = body
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    // Insert property
    const propertyRes = await fetch(`${supabaseUrl}/rest/v1/properties`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        landlord_id: userId,
        address,
        unit: unit || null,
        rent: rent ? parseFloat(rent) : null,
        security_deposit: security_deposit ? parseFloat(security_deposit) : null
      })
    })
    
    if (!propertyRes.ok) {
      const err = await propertyRes.text()
      return NextResponse.json({ error: 'Failed to create property: ' + err }, { status: 500 })
    }
    
    const properties = await propertyRes.json()
    const property = properties[0]
    
    // Create application with token
    const token = crypto.randomUUID()
    const appRes = await fetch(`${supabaseUrl}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        property_id: property.id,
        token,
        status: 'pending'
      })
    })
    
    if (!appRes.ok) {
      const err = await appRes.text()
      return NextResponse.json({ error: 'Failed to create application: ' + err }, { status: 500 })
    }
    
    return NextResponse.json({ property, token })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
