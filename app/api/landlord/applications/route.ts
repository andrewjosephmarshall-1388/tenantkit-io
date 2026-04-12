import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Get all properties for this landlord
    const propsRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?landlord_id=eq.${userId}&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const properties = await propsRes.json()
    
    if (!properties || properties.length === 0) {
      return NextResponse.json({ applications: [] })
    }
    
    const propertyIds = properties.map((p: any) => p.id)
    
    // Get applications for these properties
    const appsRes = await fetch(
      `${supabaseUrl}/rest/v1/applications?property_id=in.(${propertyIds.join(',')})&select=*,properties(id,address,unit)`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const applications = await appsRes.json()
    
    return NextResponse.json({ applications: applications || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}