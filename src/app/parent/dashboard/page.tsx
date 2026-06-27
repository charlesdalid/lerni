"use client"

import Link from "next/link"
import { Lightbulb, Plus, CheckCircle2, TrendingUp, Clock, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { TopNav } from "@/components/TopNav"

const weekDays = [
  { label: "Mon", done: true },
  { label: "Tue", done: true },
  { label: "Wed", done: false },
  { label: "Thu", done: true },
  { label: "Fri", done: false },
]

const concepts = [
  { name: "Reading large numbers", mastery: "mastered" },
  { name: "Improper fractions", mastery: "practising" },
  { name: "Decimals & hundredths", mastery: "practising" },
  { name: "3D nets", mastery: "not_started" },
]

const masteryConfig = {
  mastered: {
    label: "✓ Mastered",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bar: "bg-emerald-500",
    pct: 100,
  },
  practising: {
    label: "◑ Practising",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    bar: "bg-amber-400",
    pct: 55,
  },
  not_started: {
    label: "○ Not started",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    bar: "bg-gray-200",
    pct: 0,
  },
}

const recentSessions = [
  { date: "Today", topic: "Decimals", activities: 4, points: 40, correct: "3/4" },
  { date: "Yesterday", topic: "Improper fractions", activities: 6, points: 50, correct: "5/6" },
  { date: "Mon", topic: "Large numbers", activities: 5, points: 50, correct: "5/5" },
]

export default function ParentDashboard() {
  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <TopNav />

      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a0f2e]">Karla's progress</h1>
              <p className="text-sm text-gray-400">Year 5 · Mathematics</p>
            </div>
          </div>
          <Link
            href="/parent/upload"
            className="bg-[#6B3FA0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#4a2970] transition-colors shadow-md shadow-purple-200"
          >
            <Plus size={16} /> Upload material
          </Link>
        </div>

        {/* Stat summary row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Clock, label: "Time practised", value: "47 min", sub: "this week" },
            { icon: Star, label: "Points earned", value: "128", sub: "this week" },
            { icon: TrendingUp, label: "Streak", value: "6 days", sub: "keep it up! 🔥" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ede8f5] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#6B3FA0]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-xl font-bold text-[#1a0f2e] leading-none">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: weekly tracker + insight */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">This Week</p>
              <p className="text-base font-bold text-[#1a0f2e] mb-5">
                Karla practised{" "}
                <span className="text-[#e8439b]">3</span>{" "}
                of{" "}
                <span className="text-[#6B3FA0]">5</span>{" "}
                days
              </p>
              <div className="flex gap-2">
                {weekDays.map((day) => (
                  <div key={day.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      day.done ? "bg-[#6B3FA0]" : "bg-white border-2 border-gray-100"
                    )}>
                      {day.done && <CheckCircle2 size={18} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-400">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Lightbulb size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700 mb-1">Decimals are tricky right now</p>
                  <p className="text-sm text-orange-600 leading-relaxed">
                    Karla is finding decimals tricky — 3 more sessions recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent sessions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Recent Sessions</p>
              <div className="flex flex-col gap-3">
                {recentSessions.map((s) => (
                  <div key={s.date} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1a0f2e]">{s.topic}</p>
                      <p className="text-xs text-gray-400">{s.date} · {s.correct} correct</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={13} className="fill-amber-400" />
                      <span className="text-sm font-bold">{s.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: concept mastery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-5">Concept Mastery</p>
              <div className="flex flex-col gap-5">
                {concepts.map((concept) => {
                  const config = masteryConfig[concept.mastery as keyof typeof masteryConfig]
                  return (
                    <div key={concept.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#1a0f2e]">{concept.name}</span>
                        <span className={cn("text-xs font-semibold rounded-full px-3 py-1", config.className)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="h-2 bg-[#ede8f5] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", config.bar)}
                          style={{ width: `${config.pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
