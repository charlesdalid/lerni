"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, CheckCircle2, Play, Star, Trophy, Loader2, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { TopNav } from "@/components/TopNav"
import { cn } from "@/lib/utils"

interface Child {
  id: string
  name: string
  year_level: number
  xp: number
  current_streak: number
}

interface Topic {
  id: string
  name: string
  subject: string
  concepts: { id: string; name: string; mastery_level: number }[]
}

export default function ChildHome() {
  const router = useRouter()
  const [child, setChild] = useState<Child | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [startingTopic, setStartingTopic] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Get first child of this family
      const { data: children } = await supabase
        .from("children")
        .select("id, name, year_level, xp, current_streak")
        .limit(1)
        .single()

      if (!children) { setLoading(false); return }
      setChild(children)

      // Get active topics with concepts
      const { data: topicData } = await supabase
        .from("topics")
        .select("id, name, subject, concepts(id, name, mastery_level)")
        .eq("child_id", children.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      setTopics(topicData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function startSession(topicId: string) {
    if (!child || startingTopic) return
    setStartingTopic(topicId)

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: child.id, topicId }),
    })

    if (res.ok) {
      const { data } = await res.json()
      router.push(`/child/session/${data.sessionId}`)
    } else {
      setStartingTopic(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ede8f5] flex items-center justify-center">
        <Loader2 size={36} className="text-[#6B3FA0] animate-spin" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-[#ede8f5] flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm">
            <BookOpen size={36} className="text-[#6B3FA0] mx-auto mb-4" />
            <p className="font-bold text-[#1a0f2e] mb-2">No child profile yet</p>
            <p className="text-sm text-gray-400">Ask a parent to set one up.</p>
          </div>
        </div>
      </div>
    )
  }

  const initial = child.name[0]?.toUpperCase() ?? "?"

  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <TopNav />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Greeting */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a0f2e]">Hi {child.name}! 👋</h1>
                <p className="text-sm text-gray-500">Ready for today&apos;s quest?</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              <Flame size={20} className="text-orange-500" />
              <div>
                <p className="text-xs text-orange-500 font-medium">Day streak</p>
                <p className="text-lg font-bold text-orange-600">
                  {child.current_streak} {child.current_streak > 0 ? "🔥" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* XP */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Total XP</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f9f6ff] rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-[#1a0f2e]">{child.xp}</span>
                </div>
                <p className="text-xs text-gray-400">Total XP</p>
              </div>
              <div className="bg-[#f9f6ff] rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy size={14} className="text-[#6B3FA0]" />
                  <span className="text-lg font-bold text-[#1a0f2e]">{topics.length}</span>
                </div>
                <p className="text-xs text-gray-400">Topics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — topics */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {topics.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <BookOpen size={36} className="text-[#6B3FA0] mx-auto mb-4 opacity-40" />
              <p className="font-bold text-[#1a0f2e] mb-2">No topics yet</p>
              <p className="text-sm text-gray-400">
                Ask a parent to upload a school document to get started!
              </p>
            </div>
          ) : (
            topics.map((topic) => {
              const totalConcepts = topic.concepts?.length ?? 0
              const masteredConcepts = (topic.concepts ?? []).filter(
                (c) => c.mastery_level >= 3,
              ).length
              const isStarting = startingTopic === topic.id

              return (
                <div key={topic.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#1a0f2e]">{topic.name}</h2>
                      <p className="text-sm text-gray-400">{topic.subject}</p>
                    </div>
                    <button
                      onClick={() => startSession(topic.id)}
                      disabled={!!startingTopic}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-purple-100",
                        isStarting
                          ? "bg-[#4a2970] text-white cursor-wait"
                          : "bg-[#6B3FA0] text-white hover:bg-[#4a2970]",
                        startingTopic && !isStarting && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {isStarting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Play size={15} fill="white" />
                      )}
                      Play
                    </button>
                  </div>

                  {/* Concepts */}
                  <div className="flex flex-col gap-2">
                    {(topic.concepts ?? []).slice(0, 6).map((concept) => {
                      const mastered = concept.mastery_level >= 3
                      return (
                        <div
                          key={concept.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl",
                            mastered ? "bg-emerald-50" : "bg-[#f9f7fe]",
                          )}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                              mastered ? "bg-emerald-500" : "bg-[#ede8f5]",
                            )}
                          >
                            {mastered ? (
                              <CheckCircle2 size={14} className="text-white" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-[#6B3FA0]" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              mastered ? "text-emerald-700" : "text-[#1a0f2e]",
                            )}
                          >
                            {concept.name}
                          </span>
                        </div>
                      )
                    })}
                    {totalConcepts > 6 && (
                      <p className="text-xs text-gray-400 text-center pt-1">
                        +{totalConcepts - 6} more concepts
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {masteredConcepts}/{totalConcepts} mastered
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-[#ede8f5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6B3FA0] rounded-full"
                        style={{
                          width: totalConcepts
                            ? `${(masteredConcepts / totalConcepts) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
