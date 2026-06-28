"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Star, Loader2 } from "lucide-react"
import MultipleChoice from "@/components/activities/MultipleChoice"
import FillBlank from "@/components/activities/FillBlank"
import Flashcard from "@/components/activities/Flashcard"
import type {
  MultipleChoiceContent,
  FillBlankContent,
  FlashcardContent,
} from "@/types"

interface Activity {
  id: string
  activity_type: string
  difficulty: number
  content: MultipleChoiceContent | FillBlankContent | FlashcardContent
  hint_gentle: string | null
  hint_worked: string | null
  concepts: { id: string; name: string }[]
}

const MAX_ACTIVITIES = 10

export default function SessionPage() {
  const router = useRouter()
  const { id: sessionId } = useParams<{ id: string }>()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(false)
  const [totalXp, setTotalXp] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [completing, setCompleting] = useState(false)

  const fetchNext = useCallback(async () => {
    setLoading(true)
    setAnswered(false)
    const res = await fetch(`/api/sessions/${sessionId}/next`)
    const json = await res.json()
    setActivity(json.data ?? null)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetchNext()
  }, [fetchNext])

  async function handleAttempt(isCorrect: boolean, attemptsTaken: number, hintUsed: boolean) {
    if (!activity) return
    const conceptId = activity.concepts?.[0]?.id

    const res = await fetch(`/api/sessions/${sessionId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: activity.id,
        conceptId,
        isCorrect,
        attemptsTaken,
        hintUsed,
      }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setTotalXp((x) => x + (data.pointsAwarded ?? 0))
    }

    setActivityCount((n) => n + 1)
    setAnswered(true)
  }

  async function handleComplete() {
    setCompleting(true)
    await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" })
    router.push(`/child/session/${sessionId}/complete`)
  }

  function handleNext() {
    // End session after MAX_ACTIVITIES or if no more activities
    if (activityCount >= MAX_ACTIVITIES || !activity) {
      handleComplete()
    } else {
      fetchNext()
    }
  }

  // Auto-complete when API returns null (no more activities)
  useEffect(() => {
    if (!loading && activity === null && activityCount > 0) {
      handleComplete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activity])

  const progressPct = Math.min((activityCount / MAX_ACTIVITIES) * 100, 100)
  const concept = activity?.concepts?.[0]

  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#e8e0f5] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push("/child/home")}
          className="w-9 h-9 rounded-full bg-[#ede8f5] flex items-center justify-center flex-shrink-0 hover:bg-[#d8cff0] transition-colors"
        >
          <ChevronLeft size={20} className="text-[#6B3FA0]" />
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
            <span>Activity {activityCount + 1}</span>
            {concept && (
              <span className="font-semibold text-[#6B3FA0] uppercase tracking-wide truncate max-w-[160px]">
                {concept.name}
              </span>
            )}
          </div>
          <div className="h-2.5 bg-[#ede8f5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e8439b] to-[#6B3FA0] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 flex-shrink-0">
          <Star size={15} className="text-amber-400 fill-amber-400" />
          <span className="text-sm font-bold text-amber-600">{totalXp} XP</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={36} className="text-[#6B3FA0] animate-spin" />
              <p className="text-gray-400">Loading next activity…</p>
            </div>
          ) : activity ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col gap-0">
              {activity.activity_type === "multiple_choice" && (
                <MultipleChoice
                  content={activity.content as MultipleChoiceContent}
                  hintGentle={activity.hint_gentle}
                  hintWorked={activity.hint_worked}
                  onAttempt={handleAttempt}
                />
              )}
              {activity.activity_type === "fill_blank" && (
                <FillBlank
                  content={activity.content as FillBlankContent}
                  hintGentle={activity.hint_gentle}
                  hintWorked={activity.hint_worked}
                  onAttempt={handleAttempt}
                />
              )}
              {activity.activity_type === "flashcard" && (
                <Flashcard
                  content={activity.content as FlashcardContent}
                  onAttempt={handleAttempt}
                />
              )}

              {answered && (
                <button
                  onClick={handleNext}
                  disabled={completing}
                  className="mt-6 w-full bg-[#6B3FA0] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors disabled:opacity-60"
                >
                  {completing ? "Saving…" : activityCount >= MAX_ACTIVITIES ? "Finish →" : "Next →"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
