import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { validateUpload } from "@/lib/validation/upload"
import { extractPdfText } from "@/lib/parsers/pdf"
import { extractOfficeText } from "@/lib/parsers/pptx"
import { processDocument } from "@/lib/ai/pipeline"
import { z } from "zod"

const bodySchema = z.object({
  childId: z.string().uuid(),
  subject: z.string().min(1).max(100),
  yearLevel: z.number().int().min(1).max(12),
})

export async function POST(request: NextRequest) {
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

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const metaRaw = formData.get("meta") as string | null

  if (!file || !metaRaw) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "File and meta are required" } },
      { status: 400 },
    )
  }

  // Validate file
  const fileValidation = validateUpload({ size: file.size, type: file.type })
  if (!fileValidation.ok) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: fileValidation.error } },
      { status: 422 },
    )
  }

  // Validate meta
  const metaParsed = bodySchema.safeParse(JSON.parse(metaRaw))
  if (!metaParsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid meta fields" } },
      { status: 422 },
    )
  }
  const { childId, subject, yearLevel } = metaParsed.data

  // Verify child belongs to this family
  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!family) {
    return NextResponse.json(
      { error: { code: "UNAUTHORISED", message: "No family found" } },
      { status: 403 },
    )
  }

  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("family_id", family.id)
    .single()

  if (!child) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Child not found" } },
      { status: 404 },
    )
  }

  // Upload to Supabase Storage (service role to bypass RLS on storage)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const storagePath = `documents/${family.id}/${childId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: storageError } = await adminClient.storage
    .from("documents")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageError) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to store file" } },
      { status: 500 },
    )
  }

  // Create source_documents record
  const { data: doc, error: docError } = await adminClient
    .from("source_documents")
    .insert({
      family_id: family.id,
      child_id: childId,
      storage_path: storagePath,
      filename: file.name,
      file_type: ext,
      subject,
      year_level: yearLevel,
      status: "processing",
      prompt_version: "1.0.0",
    })
    .select("id")
    .single()

  if (docError || !doc) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to create document record" } },
      { status: 500 },
    )
  }

  // Extract text
  let sourceText: string
  try {
    if (file.type === "application/pdf") {
      sourceText = await extractPdfText(buffer)
    } else {
      sourceText = await extractOfficeText(buffer, file.name)
    }
  } catch (err) {
    await adminClient
      .from("source_documents")
      .update({ status: "failed", error_message: String(err) })
      .eq("id", doc.id)

    return NextResponse.json(
      { error: { code: "PROCESSING_FAILED", message: String(err) } },
      { status: 422 },
    )
  }

  // Run AI pipeline (uses adminClient so it can write activities past RLS)
  try {
    const result = await processDocument(
      sourceText,
      yearLevel,
      subject,
      doc.id,
      family.id,
      childId,
      adminClient,
    )

    return NextResponse.json({ data: { documentId: doc.id, ...result } })
  } catch (err) {
    await adminClient
      .from("source_documents")
      .update({ status: "failed", error_message: String(err) })
      .eq("id", doc.id)

    return NextResponse.json(
      { error: { code: "AI_FAILED", message: String(err) } },
      { status: 500 },
    )
  }
}
