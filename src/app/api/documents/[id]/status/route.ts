import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
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

  const { data: doc } = await supabase
    .from("source_documents")
    .select("id, status, error_message, filename, processed_at")
    .eq("id", id)
    .single()

  if (!doc) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Document not found" } },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: doc })
}
