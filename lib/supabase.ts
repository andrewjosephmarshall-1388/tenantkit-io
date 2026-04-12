import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // During build, return a mock client if env vars are missing
    // This allows the build to complete - actual errors will occur at runtime
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase environment variables - client will fail at runtime if not configured')
      // Return a minimal mock that satisfies type checks
      return {} as SupabaseClient
    }
    
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

// Export as createClient function for use in components
export const createClient = getSupabaseClient