import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, action, data } = body
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    if (action === 'update') {
      const res = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'delete') {
      // Delete applications first
      await fetch(`${supabaseUrl}/rest/v1/applications?property_id=eq.${propertyId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      })
      
      // Delete property
      const res = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      })
      
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}