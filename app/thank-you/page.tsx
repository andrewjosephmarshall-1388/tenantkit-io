'use client'
import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '500px', background: '#fff', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Application Submitted</h1>
        <p style={{ marginBottom: '1.5rem' }}>Thank you! Your rental application has been successfully sent to the landlord.</p>
        <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none' }}>Return to Home</Link>
      </div>
    </div>
  )
}
