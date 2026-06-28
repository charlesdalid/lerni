import Anthropic from "@anthropic-ai/sdk"
import type { SupabaseClient } from "@supabase/supabase-js"
import { PROMPTS, PROMPT_VERSION } from "./prompts"
import { contentSafetyCheck } from "./safety"
import type {
  ConceptExtraction,
  ExtractedConcept,
  GeneratedActivity,
  ValidationResult,
  ProcessingResult,
} from "@/types"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callClaude(prompt: string, maxTokens = 4000): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  })
  const block = response.content[0]
  return block.type === "text" ? block.text : ""
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(cleaned)
}

export async function processDocument(
  sourceText: string,
  yearLevel: number,
  subject: string,
  documentId: string,
  familyId: string,
  childId: string,
  supabase: SupabaseClient,
): Promise<ProcessingResult> {
  // ── Step 1: Extract concepts ─────────────────────────────────────────────
  const extractionRaw = await callClaude(
    PROMPTS.extractConcepts(yearLevel, subject, sourceText),
    3000,
  )
  const extraction = parseJSON<ConceptExtraction>(extractionRaw)

  if (!extraction.concepts?.length) {
    throw new Error("No concepts could be extracted from this document.")
  }

  // ── Step 2: Create topic + concepts in DB ────────────────────────────────
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      child_id: childId,
      document_id: documentId,
      subject: extraction.subject || subject,
      name: extraction.topic_name,
      year_level: yearLevel,
    })
    .select("id")
    .single()

  if (topicError || !topic) {
    throw new Error(`Failed to create topic: ${topicError?.message}`)
  }

  const conceptRows = extraction.concepts.map((c: ExtractedConcept, i: number) => ({
    topic_id: topic.id,
    name: c.name,
    description: c.description,
    display_order: i,
  }))

  const { data: concepts, error: conceptsError } = await supabase
    .from("concepts")
    .insert(conceptRows)
    .select("id, name, description, key_facts, examples")

  if (conceptsError || !concepts) {
    throw new Error(`Failed to create concepts: ${conceptsError?.message}`)
  }

  // ── Step 3–4: Generate + validate activities per concept ─────────────────
  let totalActivities = 0
  let flaggedCount = 0

  for (let i = 0; i < extraction.concepts.length; i++) {
    const concept = extraction.concepts[i]
    const conceptId = concepts[i].id

    const activitiesRaw = await callClaude(
      PROMPTS.generateActivities(concept, yearLevel, 6),
      4000,
    )
    const { activities } = parseJSON<{ activities: GeneratedActivity[] }>(activitiesRaw)

    const activityRows = []

    for (const activity of activities) {
      // Content safety check
      if (!contentSafetyCheck(activity.content)) {
        activity.needs_review = true
        activity.confidence = 0
      } else {
        // Validate with Claude
        try {
          const validationRaw = await callClaude(
            PROMPTS.validateActivity(activity, sourceText),
            500,
          )
          const validation = parseJSON<ValidationResult>(validationRaw)
          activity.confidence = validation.confidence
          activity.needs_review = !validation.passes || validation.confidence < 0.8
        } catch {
          // If validation call fails, flag for review
          activity.needs_review = true
          activity.confidence = 0
        }
      }

      if (activity.needs_review) flaggedCount++

      activityRows.push({
        concept_id: conceptId,
        activity_type: activity.type,
        difficulty: activity.difficulty ?? 2,
        content: activity.content,
        hint_gentle: activity.hint_gentle,
        hint_worked: activity.hint_worked,
        ai_confidence: activity.confidence,
        needs_review: activity.needs_review,
        review_status: activity.needs_review ? "pending" : "approved",
        prompt_version: PROMPT_VERSION,
      })
    }

    if (activityRows.length > 0) {
      const { error: actError } = await supabase.from("activities").insert(activityRows)
      if (actError) throw new Error(`Failed to save activities: ${actError.message}`)
    }

    totalActivities += activityRows.length
  }

  // ── Step 5: Mark document as ready ───────────────────────────────────────
  await supabase
    .from("source_documents")
    .update({ status: "ready", processed_at: new Date().toISOString() })
    .eq("id", documentId)

  return {
    topic_name: extraction.topic_name,
    concept_count: extraction.concepts.length,
    activity_count: totalActivities,
    flagged_count: flaggedCount,
    prompt_version: PROMPT_VERSION,
  }
}
