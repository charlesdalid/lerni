export function buildActivityPrompt(content: string, yearLevel: number): string {
  return `You are an educational content designer creating practice activities for a Year ${yearLevel} student.

Given the following lesson content, generate exactly 20 practice activities as a JSON array.

LESSON CONTENT:
${content}

RULES:
- Each activity must test a concept directly from the lesson content
- Vary activity types: use "multiple_choice", "fill_blank", and "flashcard"
- For multiple_choice: provide exactly 4 options, only one correct
- For fill_blank: use ___ as the blank placeholder
- For flashcard: front is a term/concept, back is the definition/answer
- Difficulty should be appropriate for Year ${yearLevel}
- Never include PII or personally identifying content

RESPONSE FORMAT (return only valid JSON, no markdown):
[
  {
    "type": "multiple_choice",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "...",
    "concept_tag": "..."
  },
  {
    "type": "fill_blank",
    "question": "...",
    "answer": "...",
    "concept_tag": "..."
  },
  {
    "type": "flashcard",
    "front": "...",
    "back": "...",
    "concept_tag": "..."
  }
]`
}
