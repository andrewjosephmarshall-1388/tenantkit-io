import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const applicationId = request.nextUrl.searchParams.get('applicationId')
  
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
  }

  // Verify user has access to this application
  const { data: application } = await supabase
    .from('applications')
    .select('property_id, tenant_id')
    .eq('id', applicationId)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { data: property } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', application.property_id)
    .single()

  // Must be landlord or tenant
  const isLandlord = property?.landlord_id === user.id
  const isTenant = application.tenant_id === user.id

  if (!isLandlord && !isTenant) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { applicationId, content, senderRole } = await request.json()

  if (!applicationId || !content || !senderRole) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify access
  const { data: application } = await supabase
    .from('applications')
    .select('property_id, tenant_id')
    .eq('id', applicationId)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { data: property } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', application.property_id)
    .single()

  const isLandlord = property?.landlord_id === user.id
  const isTenant = application.tenant_id === user.id

  if (!isLandlord && !isTenant) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      application_id: applicationId,
      sender_role: senderRole,
      sender_id: user.id,
      content
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message })
}
