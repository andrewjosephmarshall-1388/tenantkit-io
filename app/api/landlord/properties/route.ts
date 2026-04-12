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
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }
    
    // Get all properties for this landlord
    const propsRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?landlord_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    )
    const properties = await propsRes.json()
    
    // Get applications for each property
    const propertyIds = properties.map((p: any) => p.id)
    let applications: any[] = []
    
    if (propertyIds.length > 0) {
      const appsRes = await fetch(
        `${supabaseUrl}/rest/v1/applications?property_id=in.(${propertyIds.join(',')})&select=*`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      )
      applications = await appsRes.json()
    }
    
    // Attach applications to properties
    const result = (properties || []).map((prop: any) => ({
      ...prop,
      applications: applications.filter((app: any) => app.property_id === prop.id)
    }))
    
    return NextResponse.json({ properties: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}