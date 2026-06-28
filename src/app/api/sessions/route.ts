import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const bodySchema = z.object({
  childId: z.string().uuid(),
  topicId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
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
      { error: { code: "VALIDATION_ERROR", message: "childId and topicId are required" } },
      { status: 400 },
    )
  }
  const { childId, topicId } = parsed.data

  // Verify child belongs to this family
  const { data: child } = await supabase
    .from("children")
    .select("id, families!inner(user_id)")
    .eq("id", childId)
    .single()

  // @ts-expect-error: Supabase join type
  if (!child || child.families?.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Child not found" } },
      { status: 404 },
    )
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ child_id: childId, topic_id: topicId })
    .select("id")
    .single()

  if (error || !session) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create session" } },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: { sessionId: session.id } })
}
