import type { ExtractedConcept } from "@/types"

export const PROMPT_VERSION = "1.0.0"

export const PROMPTS = {
  extractConcepts: (yearLevel: number, subject: string, sourceText: string) => `
You are an educational content analyst for primary and secondary school (Years 1–12).
Extract the key learning concepts from the school material below.

Year level: ${yearLevel}
Subject: ${subject}

STRICT RULES:
- Only include concepts explicitly present in the source. Add nothing extra.
- If something is unclear, omit it rather than guess.
- Return ONLY valid JSON. No markdown, no code fences, no commentary.

Source material:
${sourceText.slice(0, 12000)}

Return this exact JSON structure:
{
  "topic_name": "string",
  "subject": "string",
  "concepts": [
    {
      "name": "string",
      "description": "string (1–2 sentences, year-appropriate language)",
      "key_facts": ["string"],
      "examples": [
        { "question": "string", "answer": "string" }
      ]
    }
  ]
}`.trim(),

  generateActivities: (concept: ExtractedConcept, yearLevel: number, count = 6) => `
You are a game designer creating educational activities for a Year ${yearLevel} student.
Generate ${count} activities for the concept below. Use ONLY the provided content — no extra facts.

Concept: ${concept.name}
Description: ${concept.description}
Key facts: ${concept.key_facts.join("; ")}
Examples: ${JSON.stringify(concept.examples)}

RULES:
- Every correct answer must be derivable from the content above.
- Wrong options must be plausible but clearly wrong.
- Language must suit Year ${yearLevel}.
- Use at least 2 different activity types across the ${count} activities.
- Return ONLY valid JSON. No markdown, no code fences.

Activity types:
- multiple_choice: question + options array [{id, text, correct}] with exactly 4 options, exactly 1 correct
- fill_blank: template string with ___ for the blank + answer + variants array of acceptable answers
- drag_drop: instruction + pairs array [{left, right}] with 4–6 pairs
- flashcard: front (question/term) + back (answer/definition)

Return this exact JSON:
{
  "activities": [
    {
      "type": "multiple_choice | fill_blank | drag_drop | flashcard",
      "difficulty": 1,
      "content": {},
      "hint_gentle": "string (nudge without revealing answer)",
      "hint_worked": "string (full step-by-step explanation)",
      "confidence": 0.95
    }
  ]
}`.trim(),

  validateActivity: (activity: unknown, sourceText: string) => `
Review this educational activity. Respond in JSON only — no other text.

Activity:
${JSON.stringify(activity, null, 2)}

Source material (first 2000 chars):
${sourceText.slice(0, 2000)}

Check:
1. Is the marked correct answer actually correct?
2. Are all wrong options clearly wrong?
3. Is any content NOT present in the source material?
4. Is the question clear and age-appropriate?

Return: { "passes": true, "issues": [], "confidence": 0.95 }`.trim(),
}
