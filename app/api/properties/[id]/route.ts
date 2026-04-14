import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    // Use public anon key for public listing page
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=*`,
      {
        headers: {
          'apikey': serviceKey || anonKey || '',
          'Authorization': `Bearer ${serviceKey || anonKey || ''}`
        } as any
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}