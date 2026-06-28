import { createClient } from "@supabase/supabase-js"

// Service-role client — bypasses RLS.
// ONLY import this in server-side code (API routes, server actions).
// NEVER expose to the browser. NEVER use NEXT_PUBLIC_ prefix on the key.

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
}

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
