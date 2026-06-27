import { NextRequest, NextResponse } from "next/server"

// TODO Week 5: fetch activity from Supabase, enforce needs_review = false before returning
// Activities with needs_review = true must NEVER be served to children

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Placeholder until Supabase is wired up
  return NextResponse.json({
    message: "Activity fetch not yet implemented.",
    id,
  })
}
