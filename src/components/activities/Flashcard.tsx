"use client"

import { useState } from "react"
import { RotateCcw, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FlashcardContent } from "@/types"

interface Props {
  content: FlashcardContent
  onAttempt: (isCorrect: boolean, attemptsTaken: number, hintUsed: boolean) => void
}

export default function Flashcard({ content, onAttempt }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  function handleSelfScore(correct: boolean) {
    setIsCorrect(correct)
    setAnswered(true)
    onAttempt(correct, 1, false)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg text-gray-500 font-medium">
        Read the card, then tap to reveal the answer.
      </p>

      {/* Flip card */}
      <div
        onClick={() => !answered && setFlipped((f) => !f)}
        className={cn(
          "relative w-full min-h-[220px] rounded-3xl cursor-pointer select-none transition-all duration-300",
          !answered && "hover:shadow-lg hover:shadow-purple-100 active:scale-[0.99]",
          answered && "cursor-default",
        )}
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#6B3FA0] to-[#8b5cf6] rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Question</p>
            <p className="text-white text-2xl font-bold leading-snug">{content.front}</p>
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/40 text-xs">
              <RotateCcw size={12} /> tap to flip
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-white border-2 border-[#e8e0f5] rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-[#6B3FA0]/60 text-xs font-semibold uppercase tracking-widest mb-4">Answer</p>
            <p className="text-[#1a0f2e] text-2xl font-bold leading-snug">{content.back}</p>
          </div>
        </div>
      </div>

      {/* Self-scoring — only show after flipped */}
      {flipped && !answered && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-center text-gray-400 font-medium">Did you know the answer?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSelfScore(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border-2 border-red-200 py-3.5 rounded-2xl font-bold hover:bg-red-100 transition-colors"
            >
              <XCircle size={18} /> Not quite
            </button>
            <button
              onClick={() => handleSelfScore(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 py-3.5 rounded-2xl font-bold hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 size={18} /> Got it!
            </button>
          </div>
        </div>
      )}

      {answered && (
        <div
          className={cn(
            "rounded-2xl px-5 py-4 flex items-center justify-between",
            isCorrect
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-red-50 border border-red-200",
          )}
        >
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle2 size={24} className="text-emerald-500" />
            ) : (
              <XCircle size={24} className="text-red-400" />
            )}
            <p className={cn("font-bold", isCorrect ? "text-emerald-700" : "text-red-600")}>
              {isCorrect ? "Nice! Marked as known 🎉" : "We'll show this one again 💪"}
            </p>
          </div>
          {isCorrect && (
            <div className="bg-emerald-500 text-white font-bold text-sm rounded-full px-4 py-2">
              +10 XP
            </div>
          )}
        </div>
      )}
    </div>
  )
}
