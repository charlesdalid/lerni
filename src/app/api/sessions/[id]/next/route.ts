import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORISED", message: "Not logged in" } },
      { status: 401 },
    )
  }

  // Load session + verify ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id, child_id, topic_id, children!inner(family_id, families!inner(user_id))")
    .eq("id", sessionId)
    .is("ended_at", null)
    .single()

  // @ts-expect-error: nested join types
  if (!session || session.children?.families?.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Session not found" } },
      { status: 404 },
    )
  }

  // Activities already attempted in this session
  const { data: attempted } = await supabase
    .from("activity_attempts")
    .select("activity_id")
    .eq("session_id", sessionId)

  const attemptedIds = (attempted ?? []).map((a) => a.activity_id)

  // Find the next approved activity for this topic, not yet attempted
  const query = supabase
    .from("activities")
    .select(`
      id, activity_type, difficulty, content, hint_gentle, hint_worked,
      concepts!inner(id, name, topic_id)
    `)
    .eq("review_status", "approved")
    .eq("is_active", true)
    .eq("concepts.topic_id", session.topic_id)
    .order("difficulty", { ascending: true })
    .limit(1)

  if (attemptedIds.length > 0) {
    query.not("id", "in", `(${attemptedIds.join(",")})`)
  }

  const { data: activities } = await query
  const activity = activities?.[0] ?? null

  if (!activity) {
    return NextResponse.json({ data: null }) // Session complete
  }

  return NextResponse.json({ data: activity })
}
