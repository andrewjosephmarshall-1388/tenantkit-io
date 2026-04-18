import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', lineHeight: 1.6 }}>
      <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1.5rem' }}>Terms of Service</h1>
      <p style={{ color: '#6b7280' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
        <p>By accessing and using TenantKit, you accept and agree to be bound by the terms and provision of this agreement.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Description of Service</h2>
        <p>TenantKit is a web-based platform that helps landlords manage tenant applications, collect rental payments, and conduct move-in inspections.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Payment Terms</h2>
        <p>Subscription fees are billed monthly. You can cancel your subscription at any time through your account settings.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. User Content</h2>
        <p>You retain ownership of any content you upload to TenantKit. By uploading content, you grant us license to use it for operating the service.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Limitation of Liability</h2>
        <p>TenantKit is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Contact</h2>
        <p>If you have questions about these terms, please contact us at support@tenantkit.io</p>
      </section>
    </div>
  )
}