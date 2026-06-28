"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Star, Flame, Trophy, ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SessionSummary {
  total_points: number
  activities_count: number
  correct_count: number
  ended_at: string | null
}

export default function SessionCompletePage() {
  const router = useRouter()
  const { id: sessionId } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: session } = await supabase
        .from("sessions")
        .select("total_points, activities_count, correct_count, ended_at, child_id")
        .eq("id", sessionId)
        .single()

      if (session) {
        setSummary(session)
        const { data: child } = await supabase
          .from("children")
          .select("current_streak")
          .eq("id", session.child_id)
          .single()
        setStreak(child?.current_streak ?? null)
      }

      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ede8f5] flex items-center justify-center">
        <Loader2 size={36} className="text-[#6B3FA0] animate-spin" />
      </div>
    )
  }

  if (!summary) {
    router.push("/child/home")
    return null
  }

  const accuracy =
    summary.activities_count > 0
      ? Math.round((summary.correct_count / summary.activities_count) * 100)
      : 0

  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col items-center justify-center px-6 py-12">
      {/* Celebration */}
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-4xl font-extrabold text-[#1a0f2e] mb-2 text-center">
        Session complete!
      </h1>
      <p className="text-gray-400 text-lg mb-10 text-center">
        Great effort — here&apos;s how you did:
      </p>

      {/* Stats */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Star size={22} className="text-amber-500 fill-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">XP earned</p>
            <p className="text-2xl font-extrabold text-[#1a0f2e]">+{summary.total_points}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#ede8f5] flex items-center justify-center flex-shrink-0">
            <Trophy size={22} className="text-[#6B3FA0]" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Accuracy</p>
            <p className="text-2xl font-extrabold text-[#1a0f2e]">{accuracy}%</p>
          </div>
          <div className="ml-auto text-sm text-gray-400">
            {summary.correct_count}/{summary.activities_count} correct
          </div>
        </div>

        {streak !== null && (
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Flame size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Day streak</p>
              <p className="text-2xl font-extrabold text-[#1a0f2e]">{streak} 🔥</p>
            </div>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={() => router.push("/child/home")}
          className="w-full bg-[#6B3FA0] text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#4a2970] transition-colors shadow-lg shadow-purple-200"
        >
          Back to home <ArrowRight size={20} />
        </button>
        <button
          onClick={() => router.back()}
          className="w-full bg-white text-[#6B3FA0] border-2 border-[#6B3FA0] py-4 rounded-2xl font-semibold hover:bg-[#ede8f5] transition-colors"
        >
          Play again
        </button>
      </div>
    </div>
  )
}
