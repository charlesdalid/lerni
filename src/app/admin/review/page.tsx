import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { adminClient } from "@/lib/supabase/admin"
import ReviewClient from "./ReviewClient"

export default async function AdminReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch all activities pending review with context
  const { data: activities } = await adminClient
    .from("activities")
    .select(`
      id,
      activity_type,
      difficulty,
      content,
      hint_gentle,
      hint_worked,
      ai_confidence,
      review_status,
      needs_review,
      created_at,
      concepts (
        name,
        topics (
          name,
          children ( name, year_level )
        )
      )
    `)
    .eq("needs_review", true)
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(50)

  return <ReviewClient activities={activities ?? []} />
}
