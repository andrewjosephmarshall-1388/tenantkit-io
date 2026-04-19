import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)
    
    // Find tenant by email
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !tenant) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, tenant.password_hash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Get property info
    const { data: property } = await supabase
      .from('properties')
      .select('*, users!inner(email)') // landlord email
      .eq('id', tenant.property_id)
      .single()
    
    // Get application ID
    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({ 
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        rentEnabled: tenant.rent_enabled,
        maintenanceEnabled: tenant.maintenance_enabled
      },
      property: {
        id: property.id,
        address: property.address,
        rent: property.rent,
        landlordEmail: property.users?.email,
        applicationId: application?.id
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}