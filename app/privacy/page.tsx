import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', lineHeight: 1.6 }}>
      <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Home</Link>
      
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1.5rem' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, including:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Account information (name, email, phone)</li>
          <li>Property and rental information</li>
          <li>Tenant application data</li>
          <li>Payment information (processed securely via Stripe)</li>
        </ul>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Provide and maintain our services</li>
          <li>Process rental payments</li>
          <li>Send you account-related communications</li>
          <li>Improve and develop new features</li>
        </ul>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Service providers (Stripe, Supabase) who help us operate</li>
          <li>Legal authorities when required by law</li>
        </ul>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Data Security</h2>
        <p>We use industry-standard security measures to protect your data, including encryption and secure storage via Supabase.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Your Rights</h2>
        <p>You may access, update, or delete your personal information at any time through your account settings or by contacting us.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Data Retention</h2>
        <p>We retain your information for as long as your account is active or as needed to provide you services.</p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Contact</h2>
        <p>If you have questions about this Privacy Policy, please contact us at support@test.tenant-kit.com</p>
      </section>
    </div>
  )
}