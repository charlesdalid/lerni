import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this user already has a family set up
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: family } = await supabase
          .from("families")
          .select("id")
          .eq("user_id", user.id)
          .single()

        // New user — go through consent + onboarding
        if (!family) {
          return NextResponse.redirect(`${origin}/consent`)
        }

        // Returning user — go to dashboard
        return NextResponse.redirect(`${origin}/parent/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
