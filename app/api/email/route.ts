'use server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()
    // Placeholder: In a real app you'd integrate with an email provider (SendGrid, SES, etc.)
    console.log('--- Sending email ---')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML:', html)
    // Simulate success
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Email send error', e)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
