import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,       // store session in localStorage → survives page reloads
    autoRefreshToken: true,     // silently refresh access token before it expires
    detectSessionInUrl: true,   // handle magic-link / OAuth redirects automatically
  },
})
