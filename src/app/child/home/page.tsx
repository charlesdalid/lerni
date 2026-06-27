"use client"

import Link from "next/link"
import { Flame, CheckCircle2, Lock, Play, Star, Trophy } from "lucide-react"
import { TopNav } from "@/components/TopNav"

const concepts = [
  { id: 1, name: "Large numbers", state: "done", xp: 80 },
  { id: 2, name: "Improper fractions", state: "done", xp: 60 },
  { id: 3, name: "Decimals", state: "current", xp: 0 },
  { id: 4, name: "3D nets", state: "locked", xp: 0 },
]

export default function ChildHome() {
  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <TopNav />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — greeting + stats */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Greeting card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                K
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a0f2e]">Hi Karla! 👋</h1>
                <p className="text-sm text-gray-500">Ready for today's quest?</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              <Flame size={20} className="text-orange-500" />
              <div>
                <p className="text-xs text-orange-500 font-medium">Current streak</p>
                <p className="text-lg font-bold text-orange-600">6 days 🔥</p>
              </div>
            </div>
          </div>

          {/* Daily goal */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Daily Goal</span>
              <span className="text-sm font-bold text-[#6B3FA0]">2 / 4</span>
            </div>
            <div className="h-3 bg-[#ede8f5] rounded-full overflow-hidden mb-2">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#6B3FA0] to-[#e8439b]" />
            </div>
            <p className="text-sm text-gray-500">2 more activities to hit your goal 🎯</p>
          </div>

          {/* XP stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">This week</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f9f6ff] rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-[#1a0f2e]">128</span>
                </div>
                <p className="text-xs text-gray-400">XP earned</p>
              </div>
              <div className="bg-[#f9f6ff] rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy size={14} className="text-[#6B3FA0]" />
                  <span className="text-lg font-bold text-[#1a0f2e]">12</span>
                </div>
                <p className="text-xs text-gray-400">Activities done</p>
              </div>
            </div>
          </div>

          {/* Play button */}
          <Link
            href="/child/session"
            className="bg-[#6B3FA0] text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg hover:bg-[#4a2970] transition-colors shadow-lg shadow-purple-200"
          >
            <Play size={20} fill="white" /> Play now
          </Link>
        </div>

        {/* Right column — learning path */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1a0f2e]">Your learning path</h2>
              <span className="bg-[#ede8f5] text-[#6B3FA0] text-xs font-semibold px-3 py-1.5 rounded-full">
                Maths · Fractions
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {concepts.map((concept, i) => (
                <ConceptRow key={concept.id} concept={concept} isLast={i === concepts.length - 1} />
              ))}
            </div>
          </div>

          {/* Subject progress */}
          <div className="mt-4 bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1a0f2e] mb-4">Subject progress</h3>
            <div className="flex flex-col gap-4">
              {[
                { subject: "Maths", pct: 55, colour: "#6B3FA0" },
                { subject: "English", pct: 30, colour: "#e8439b" },
                { subject: "Science", pct: 10, colour: "#10b981" },
              ].map(({ subject, pct, colour }) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-[#1a0f2e]">{subject}</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-[#ede8f5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colour }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConceptRow({ concept, isLast }: { concept: { name: string; state: string; xp: number }; isLast: boolean }) {
  if (concept.state === "done") {
    return (
      <div className="flex items-center gap-4 p-4 bg-[#f9f6ff] rounded-2xl border border-[#ede8f5]">
        <div className="w-11 h-11 rounded-full bg-[#6B3FA0] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#1a0f2e]">{concept.name}</p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <Star size={14} className="fill-amber-400" />
          <span className="text-sm font-bold">{concept.xp} XP</span>
        </div>
      </div>
    )
  }

  if (concept.state === "current") {
    return (
      <Link
        href="/child/session"
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#6B3FA0] to-[#8b5cf6] rounded-2xl shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 transition-all group"
      >
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Play size={20} className="text-white fill-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-base">{concept.name}</p>
          <p className="text-xs text-white/70">Start here → tap to play</p>
        </div>
        <span className="bg-[#e8439b] text-white text-xs font-bold px-3 py-1 rounded-full">
          Start here
        </span>
      </Link>
    )
  }

  // locked
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 opacity-60">
      <div className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
        <Lock size={16} className="text-gray-300" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-400">{concept.name}</p>
        <p className="text-xs text-gray-300">Complete previous topic to unlock</p>
      </div>
      <Lock size={16} className="text-gray-300" />
    </div>
  )
}
