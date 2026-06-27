import { NextRequest, NextResponse } from "next/server"
import { generateActivities } from "@/lib/ai/generate-activities"

// TODO Week 4: fetch file from Supabase Storage, extract text, then call generateActivities
// TODO Week 4: save generated activities to DB with needs_review = true
// TODO Week 4: add rate limiting (Upstash) to prevent runaway API costs

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { extractedText, yearLevel } = body as {
    extractedText?: string
    yearLevel?: number
  }

  if (!extractedText || !yearLevel) {
    return NextResponse.json(
      { error: "extractedText and yearLevel are required." },
      { status: 400 }
    )
  }

  const activities = await generateActivities(extractedText, yearLevel)

  return NextResponse.json({ activities })
}
