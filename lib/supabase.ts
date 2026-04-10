import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Use _2 vars as primary (correct Supabase project), fallback to original
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_2 || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_2 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables!')
      throw new Error('Supabase environment variables not configured')
    }
    
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

// Export as createClient function for use in components
export const createClient = getSupabaseClient

// Export supabase instance
export const supabase = getSupabaseClient()