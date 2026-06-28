"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, AlertTriangle, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  activity_type: string
  difficulty: number
  content: Record<string, unknown>
  hint_gentle: string | null
  hint_worked: string | null
  ai_confidence: number | null
  review_status: string
  needs_review: boolean
  created_at: string
  // Supabase returns joined tables as arrays
  concepts: {
    name: string
    topics: {
      name: string
      children: { name: string; year_level: number }[]
    }[]
  }[]
}

type ReviewAction = "approved" | "rejected"

export default function ReviewClient({ activities: initial }: { activities: Activity[] }) {
  const [activities, setActivities] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleReview(id: string, action: ReviewAction) {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/activities/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== id))
      }
    } finally {
      setLoading(null)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-screen bg-[#ede8f5] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a0f2e] mb-2">All clear!</h2>
          <p className="text-gray-400 text-sm">No activities pending review.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ede8f5]">
      <div className="bg-white border-b border-[#e8e0f5] px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#1a0f2e]">Activity Review</h1>
          <p className="text-xs text-gray-400">{activities.length} pending · These must be approved before children can see them</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-4">
        {activities.map((activity) => {
          const concept = activity.concepts?.[0]
          const topic = concept?.topics?.[0]
          const child = topic?.children?.[0]

          return (
            <div key={activity.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#6B3FA0] bg-[#ede8f5] rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                        {activity.activity_type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-400">
                        Difficulty {activity.difficulty}
                      </span>
                      {activity.ai_confidence !== null && (
                        <span
                          className={cn(
                            "text-xs font-medium rounded-full px-2.5 py-0.5",
                            activity.ai_confidence >= 0.8
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {Math.round((activity.ai_confidence ?? 0) * 100)}% confidence
                        </span>
                      )}
                    </div>
                    {concept && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <BookOpen size={11} />
                        <span>
                          {child?.name} (Yr {child?.year_level}) · {topic?.name} · {concept.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content preview */}
              <div className="px-6 py-4">
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl p-4 overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                  {JSON.stringify(activity.content, null, 2)}
                </pre>

                {activity.hint_gentle && (
                  <div className="mt-3 text-xs text-gray-500">
                    <span className="font-semibold">Gentle hint:</span> {activity.hint_gentle}
                  </div>
                )}
                {activity.hint_worked && (
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="font-semibold">Worked explanation:</span> {activity.hint_worked}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => handleReview(activity.id, "approved")}
                  disabled={loading === activity.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  Approve
                </button>
                <button
                  onClick={() => handleReview(activity.id, "rejected")}
                  disabled={loading === activity.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
