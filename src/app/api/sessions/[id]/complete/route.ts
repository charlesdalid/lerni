import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
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

  const { data: session } = await supabase
    .from("sessions")
    .select(`
      id, child_id, total_points, activities_count, correct_count,
      children!inner(family_id, xp, current_streak, last_session_date, families!inner(user_id))
    `)
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

  // Close the session
  await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)

  // Update child XP + streak
  // @ts-expect-error: nested join types
  const child = session.children as {
    xp: number
    current_streak: number
    last_session_date: string | null
  }

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const lastDate = child.last_session_date

  let newStreak = child.current_streak
  if (lastDate === today) {
    // Already played today — streak unchanged
  } else if (lastDate === yesterday) {
    newStreak = child.current_streak + 1
  } else {
    newStreak = 1 // Streak broken
  }

  await supabase
    .from("children")
    .update({
      xp: child.xp + session.total_points,
      current_streak: newStreak,
      last_session_date: today,
    })
    .eq("id", session.child_id)

  return NextResponse.json({
    data: {
      totalPoints: session.total_points,
      activitiesCount: session.activities_count,
      correctCount: session.correct_count,
      newStreak,
      xpEarned: session.total_points,
    },
  })
}
