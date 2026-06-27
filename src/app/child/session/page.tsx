"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Lightbulb, Star, CheckCircle2, XCircle, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTION = {
  concept: "PLACE VALUE",
  question: "What is the value of the digit 6 in 6,373,294?",
  options: [
    { id: "a", text: "6,000" },
    { id: "b", text: "600,000" },
    { id: "c", text: "6,000,000", correct: true },
    { id: "d", text: "60,000" },
  ],
  hint: "Think about which position the 6 is in — count from the right starting at ones.",
  explanation: "The 6 is in the millions place (7th position from the right), so its value is 6,000,000.",
  total: 10,
  current: 3,
  xp: 40,
}

type State = "idle" | "selected" | "correct" | "incorrect"

export default function SessionPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<State>("idle")
  const [showHint, setShowHint] = useState(false)
  const [xp, setXp] = useState(QUESTION.xp)

  const handleSelect = (id: string) => {
    if (state === "correct" || state === "incorrect") return
    setSelected(id)
    setState("selected")
  }

  const handleSubmit = () => {
    if (!selected) return
    const option = QUESTION.options.find((o) => o.id === selected)
    if (option?.correct) {
      setState("correct")
      setXp((x) => x + 10)
    } else {
      setState("incorrect")
    }
  }

  const isAnswered = state === "correct" || state === "incorrect"
  const progressPct = ((QUESTION.current - 1) / QUESTION.total) * 100

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

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
            <span>Question {QUESTION.current} of {QUESTION.total}</span>
            <span className="font-semibold text-[#6B3FA0] uppercase tracking-wide">{QUESTION.concept}</span>
          </div>
          <div className="h-2.5 bg-[#ede8f5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e8439b] to-[#6B3FA0] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* XP counter */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 flex-shrink-0">
          <Star size={15} className="text-amber-400 fill-amber-400" />
          <span className="text-sm font-bold text-amber-600">{xp} XP</span>
        </div>
      </div>

      {/* Main content — centered, max-width for readability */}
      <div className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-2xl">

          {/* Question */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1a0f2e] leading-snug mb-8">
              {QUESTION.question}
            </h2>

            {/* Options grid — 2×2 on wide screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUESTION.options.map((option) => {
                const isSelected = selected === option.id
                const isCorrectOption = option.correct

                let optionStyle = "bg-[#f8f5ff] border-[#e8e0f5] text-[#1a0f2e] hover:border-[#6B3FA0]/40 hover:bg-[#f3eeff]"
                let labelStyle = "bg-[#ede8f5] text-[#6B3FA0]"
                let icon = null

                if (isAnswered) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-50 border-emerald-400 text-[#1a0f2e]"
                    labelStyle = "bg-emerald-500 text-white"
                    icon = <CheckCircle2 size={20} className="text-emerald-500" />
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-50 border-red-300 text-gray-400"
                    labelStyle = "bg-red-400 text-white"
                    icon = <XCircle size={20} className="text-red-400" />
                  } else {
                    optionStyle = "bg-[#f8f5ff] border-[#e8e0f5] text-gray-400"
                    labelStyle = "bg-[#ede8f5] text-gray-400"
                  }
                } else if (isSelected) {
                  optionStyle = "bg-[#6B3FA0] border-[#6B3FA0] text-white hover:bg-[#6B3FA0]"
                  labelStyle = "bg-white/20 text-white"
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    disabled={isAnswered}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98]",
                      optionStyle
                    )}
                  >
                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0", labelStyle)}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className="text-base font-medium flex-1">{option.text}</span>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hint */}
          {showHint && !isAnswered && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4 flex gap-3">
              <Lightbulb size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{QUESTION.hint}</p>
            </div>
          )}

          {/* Explanation on incorrect */}
          {state === "incorrect" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-4 flex gap-3">
              <BookOpen size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Not quite — here's how to think about it:</p>
                <p className="text-sm text-red-600">{QUESTION.explanation}</p>
              </div>
            </div>
          )}

          {/* Correct feedback */}
          {state === "correct" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <div>
                  <p className="font-bold text-emerald-700">Correct! 🎉</p>
                  <p className="text-sm text-emerald-600">Great place-value thinking.</p>
                </div>
              </div>
              <div className="bg-emerald-500 text-white font-bold text-sm rounded-full px-4 py-2">+10 XP</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!isAnswered ? (
              <>
                <button
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="flex-1 sm:flex-none bg-white border-2 border-[#ede8f5] text-[#6B3FA0] py-3.5 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#ede8f5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Lightbulb size={17} /> Hint
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selected}
                  className="flex-1 bg-[#6B3FA0] text-white py-3.5 px-8 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Check answer
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/child/home")}
                className="flex-1 bg-[#6B3FA0] text-white py-3.5 px-8 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors"
              >
                Next question ›
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
