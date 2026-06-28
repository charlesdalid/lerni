// ─── Activity content shapes ────────────────────────────────────────────────

export interface MultipleChoiceOption {
  id: string
  text: string
  correct: boolean
}

export interface MultipleChoiceContent {
  question: string
  options: MultipleChoiceOption[]
}

export interface FillBlankContent {
  template: string
  answer: string
  variants: string[]
}

export interface DragDropPair {
  left: string
  right: string
}

export interface DragDropContent {
  instruction: string
  pairs: DragDropPair[]
}

export interface FlashcardContent {
  front: string
  back: string
}

export type ActivityContent =
  | MultipleChoiceContent
  | FillBlankContent
  | DragDropContent
  | FlashcardContent

export type ActivityType = "multiple_choice" | "fill_blank" | "drag_drop" | "flashcard"

// ─── AI pipeline types ───────────────────────────────────────────────────────

export interface ExtractedConcept {
  name: string
  description: string
  key_facts: string[]
  examples: Array<{ question: string; answer: string }>
}

export interface ConceptExtraction {
  topic_name: string
  subject: string
  concepts: ExtractedConcept[]
}

export interface GeneratedActivity {
  type: ActivityType
  difficulty: 1 | 2 | 3
  content: ActivityContent
  hint_gentle: string
  hint_worked: string
  confidence: number
  needs_review: boolean
}

export interface ValidationResult {
  passes: boolean
  issues: string[]
  confidence: number
}

export interface ProcessingResult {
  topic_name: string
  concept_count: number
  activity_count: number
  flagged_count: number
  prompt_version: string
}

// ─── API response shapes ─────────────────────────────────────────────────────

export type ApiSuccess<T> = { data: T; meta?: { request_id: string } }
export type ApiError = { error: { code: string; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError
