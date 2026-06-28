import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const bodySchema = z.object({
  activityId: z.string().uuid(),
  conceptId: z.string().uuid(),
  isCorrect: z.boolean(),
  attemptsTaken: z.number().int().min(1).max(10),
  hintUsed: z.boolean(),
})

const POINTS = {
  correct_first: 10,
  correct_with_hint: 7,
  correct_second: 5,
  correct_later: 3,
}

export async function POST(
  request: NextRequest,
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

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid attempt data" } },
      { status: 400 },
    )
  }
  const { activityId, conceptId, isCorrect, attemptsTaken, hintUsed } = parsed.data

  // Verify session ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id, child_id, children!inner(family_id, families!inner(user_id))")
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

  // Calculate points
  let pointsAwarded = 0
  if (isCorrect) {
    if (attemptsTaken === 1 && !hintUsed) pointsAwarded = POINTS.correct_first
    else if (hintUsed) pointsAwarded = POINTS.correct_with_hint
    else if (attemptsTaken === 2) pointsAwarded = POINTS.correct_second
    else pointsAwarded = POINTS.correct_later
  }

  // Record attempt
  const { error: attemptError } = await supabase.from("activity_attempts").insert({
    session_id: sessionId,
    activity_id: activityId,
    child_id: session.child_id,
    concept_id: conceptId,
    is_correct: isCorrect,
    attempts_taken: attemptsTaken,
    hint_used: hintUsed,
    points_awarded: pointsAwarded,
  })

  if (attemptError) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to record attempt" } },
      { status: 500 },
    )
  }

  // Update session totals
  const { data: currentSession } = await supabase
    .from("sessions")
    .select("activities_count, correct_count, total_points")
    .eq("id", sessionId)
    .single()

  if (currentSession) {
    await supabase
      .from("sessions")
      .update({
        activities_count: currentSession.activities_count + 1,
        correct_count: currentSession.correct_count + (isCorrect ? 1 : 0),
        total_points: currentSession.total_points + pointsAwarded,
      })
      .eq("id", sessionId)
  }

  return NextResponse.json({
    data: { isCorrect, pointsAwarded },
  })
}
