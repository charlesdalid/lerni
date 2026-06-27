import { NextRequest, NextResponse } from "next/server"
import { validateUpload } from "@/lib/validation/upload"

// TODO Week 3: store file in Supabase Storage, return storage path
// TODO Week 4: trigger AI pipeline after successful upload

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }

  const validation = validateUpload({ size: file.size, type: file.type })
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  // Placeholder response until Supabase Storage is wired up
  return NextResponse.json({
    message: "File received. Storage not yet configured.",
    fileName: file.name,
    size: file.size,
  })
}
