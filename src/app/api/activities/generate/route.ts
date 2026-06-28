import { NextResponse } from "next/server"

// Superseded by /api/documents/process which runs the full pipeline.
// Keeping this route as a 410 Gone so old clients get a clear signal.
export async function POST() {
  return NextResponse.json(
    { error: { code: "GONE", message: "Use POST /api/documents/process instead" } },
    { status: 410 },
  )
}
