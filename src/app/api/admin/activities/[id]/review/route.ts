import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORISED", message: "Not logged in" } },
      { status: 401 },
    )
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "status must be approved or rejected" } },
      { status: 400 },
    )
  }

  const { error } = await adminClient
    .from("activities")
    .update({ review_status: parsed.data.status })
    .eq("id", id)

  if (error) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: { id, status: parsed.data.status } })
}
