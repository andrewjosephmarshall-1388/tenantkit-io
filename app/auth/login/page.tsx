'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [initError, setInitError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (err: any) {
      setInitError(err.message)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Supabase not initialized. Please refresh.')
      return
    }
    
    setLoading(true)
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message)
      } else if (data.user) {
        // Use window.location with full URL
        const baseUrl = window.location.origin
        window.location.href = baseUrl + '/dashboard'
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo">TenantKit</Link>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        
        {initError && <div className="error">Error: {initError}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error">{error}</div>}
          
          <div className="form-group">
            <label className="label">Email</label>
            <input 
              type="email" 
              className="input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-footer">
          <Link href="/auth/forgot-password" className="forgot-link">Forgot password?</Link>
        </p>
        <p className="auth-footer">
          Don't have an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--gray-50); padding: 1rem; }
        .auth-card { width: 100%; max-width: 400px; background: var(--white); padding: 2rem; border-radius: 0.75rem; box-shadow: var(--shadow-lg); }
        .auth-logo { display: block; font-size: 1.5rem; font-weight: 700; color: var(--primary); text-align: center; margin-bottom: 1.5rem; }
        .auth-card h1 { font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 0.5rem; }
        .auth-subtitle { text-align: center; color: var(--gray-500); margin-bottom: 1.5rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; }
        .label { font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; }
        .input { padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; font-size: 1rem; }
        .input:focus { outline: none; border-color: var(--primary); }
        .btn { padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: var(--primary); color: white; border: none; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-full { width: 100%; }
        .error { background: #FEF2F2; color: var(--danger); padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
        .auth-footer { text-align: center; margin-top: 1.5rem; color: var(--gray-500); font-size: 0.875rem; }
        .auth-footer a { color: var(--primary); font-weight: 500; }
      `}</style>
    </div>
  )
}