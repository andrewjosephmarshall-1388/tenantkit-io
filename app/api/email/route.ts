'use server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()
    
    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = 're_bckKFFZZ_FYbK41CtBs88hYCRkwqwQ3h4'
    console.log('Using API key:', apiKey)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TenantKit <onboarding@test.tenant-kit.com>',
        to: [to],
        subject: subject,
        html: html || text || ''
      })
    })

    const data = await response.json()
    console.log('Resend response:', data)

    if (!response.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: data.message || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('Email send error', e)
    return NextResponse.json({ error: e.message || 'Failed to send email' }, { status: 500 })
  }
}