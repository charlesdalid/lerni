"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react"
import type { FillBlankContent } from "@/types"

interface Props {
  content: FillBlankContent
  hintGentle: string | null
  hintWorked: string | null
  onAttempt: (isCorrect: boolean, attemptsTaken: number, hintUsed: boolean) => void
}

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ")
}

export default function FillBlank({ content, hintGentle, hintWorked, onAttempt }: Props) {
  const [input, setInput] = useState("")
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showWorked, setShowWorked] = useState(false)

  const parts = content.template.split("___")

  function checkAnswer(value: string): boolean {
    const n = normalize(value)
    const allAccepted = [content.answer, ...(content.variants ?? [])].map(normalize)
    return allAccepted.includes(n)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (answered || !input.trim()) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const correct = checkAnswer(input)
    if (correct) {
      setIsCorrect(true)
      setAnswered(true)
      onAttempt(true, newAttempts, hintUsed)
    } else {
      if (newAttempts >= 2) {
        setAnswered(true)
        setShowWorked(true)
        onAttempt(false, newAttempts, hintUsed)
      } else {
        if (hintGentle) setShowHint(true)
        setInput("")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-2xl lg:text-3xl font-bold text-[#1a0f2e] leading-relaxed flex flex-wrap items-center gap-2">
        {parts[0]}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={answered}
          autoFocus
          placeholder="your answer"
          className="inline-block border-b-4 border-[#6B3FA0] bg-transparent text-[#6B3FA0] placeholder:text-[#c4a9e8] focus:outline-none text-2xl font-bold min-w-[140px] max-w-[280px] px-1"
        />
        {parts[1]}
      </div>

      {showHint && !showWorked && hintGentle && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
          <Lightbulb size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{hintGentle}</p>
        </div>
      )}

      {showWorked && hintWorked && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <BookOpen size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-1">
              The answer was: <span className="font-bold">{content.answer}</span>
            </p>
            <p className="text-sm text-blue-600">{hintWorked}</p>
          </div>
        </div>
      )}

      {answered && isCorrect && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="font-bold text-emerald-700">Correct! 🎉</p>
          </div>
          <div className="bg-emerald-500 text-white font-bold text-sm rounded-full px-4 py-2">
            +{attempts === 1 && !hintUsed ? 10 : hintUsed ? 7 : 5} XP
          </div>
        </div>
      )}

      {answered && !isCorrect && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <XCircle size={24} className="text-red-400" />
          <p className="font-bold text-red-600">Not this time — keep going! 💪</p>
        </div>
      )}

      {!answered && (
        <div className="flex gap-3 pt-1">
          {hintGentle && !showHint && (
            <button
              type="button"
              onClick={() => { setHintUsed(true); setShowHint(true) }}
              className="flex-shrink-0 bg-white border-2 border-[#ede8f5] text-[#6B3FA0] py-3.5 px-6 rounded-2xl font-semibold flex items-center gap-2 hover:bg-[#ede8f5] transition-colors"
            >
              <Lightbulb size={17} /> Hint
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex-1 bg-[#6B3FA0] text-white py-3.5 px-8 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check answer
          </button>
        </div>
      )}
    </form>
  )
}
