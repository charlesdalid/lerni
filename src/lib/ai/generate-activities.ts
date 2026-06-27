import Anthropic from "@anthropic-ai/sdk"
import { buildActivityPrompt } from "./prompts"

const client = new Anthropic()

export type ActivityType = "multiple_choice" | "fill_blank" | "flashcard"

export interface Activity {
  type: ActivityType
  concept_tag: string
  // multiple_choice
  question?: string
  options?: string[]
  correct_index?: number
  explanation?: string
  // fill_blank
  answer?: string
  // flashcard
  front?: string
  back?: string
}

export async function generateActivities(
  extractedText: string,
  yearLevel: number
): Promise<Activity[]> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildActivityPrompt(extractedText, yearLevel),
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  const activities: Activity[] = JSON.parse(text)
  return activities
}
