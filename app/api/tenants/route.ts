import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, email, name, phone, rentEnabled, maintenanceEnabled, tempPassword } = body
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)
    
    // Check if tenant email already exists
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existing) {
      return NextResponse.json({ error: 'Tenant with this email already exists' }, { status: 400 })
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    
    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        property_id: propertyId,
        email,
        name,
        phone: phone || null,
        password_hash: passwordHash,
        rent_enabled: rentEnabled || false,
        maintenance_enabled: maintenanceEnabled || false
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}