"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MultipleChoiceContent } from "@/types"

interface Props {
  content: MultipleChoiceContent
  hintGentle: string | null
  hintWorked: string | null
  onAttempt: (isCorrect: boolean, attemptsTaken: number, hintUsed: boolean) => void
}

export default function MultipleChoice({ content, hintGentle, hintWorked, onAttempt }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showWorked, setShowWorked] = useState(false)

  function handleSelect(id: string) {
    if (answered) return
    setSelected(id)
  }

  function handleSubmit() {
    if (!selected || answered) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const option = content.options.find((o) => o.id === selected)
    const correct = !!option?.correct

    if (correct) {
      setIsCorrect(true)
      setAnswered(true)
      onAttempt(true, newAttempts, hintUsed)
    } else {
      // Wrong — allow retry up to 2 times
      if (newAttempts >= 2) {
        setAnswered(true)
        setShowWorked(true)
        onAttempt(false, newAttempts, hintUsed)
      } else {
        // First wrong attempt — show gentle hint, let them retry
        if (hintGentle) setShowHint(true)
        setSelected(null)
      }
    }
  }

  function handleHint() {
    setHintUsed(true)
    setShowHint(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl lg:text-3xl font-bold text-[#1a0f2e] leading-snug">
        {content.question}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {content.options.map((option) => {
          const isSelected = selected === option.id
          const isCorrectOption = option.correct

          let optionStyle = "bg-[#f8f5ff] border-[#e8e0f5] text-[#1a0f2e] hover:border-[#6B3FA0]/40 hover:bg-[#f3eeff]"
          let labelStyle = "bg-[#ede8f5] text-[#6B3FA0]"
          let icon = null

          if (answered) {
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
            optionStyle = "bg-[#6B3FA0] border-[#6B3FA0] text-white"
            labelStyle = "bg-white/20 text-white"
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={answered}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98]",
                optionStyle,
              )}
            >
              <span
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                  labelStyle,
                )}
              >
                {option.id.toUpperCase()}
              </span>
              <span className="text-base font-medium flex-1">{option.text}</span>
              {icon && <span className="flex-shrink-0">{icon}</span>}
            </button>
          )
        })}
      </div>

      {/* Gentle hint */}
      {showHint && !showWorked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
          <Lightbulb size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{hintGentle}</p>
        </div>
      )}

      {/* Worked explanation (after 2 wrong) */}
      {showWorked && hintWorked && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <BookOpen size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-1">Here&apos;s how to think about it:</p>
            <p className="text-sm text-blue-600">{hintWorked}</p>
          </div>
        </div>
      )}

      {/* Correct feedback */}
      {answered && isCorrect && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="font-bold text-emerald-700">
              {attempts === 1 ? "First try! 🎉" : "Got it! 🙌"}
            </p>
          </div>
          <div className="bg-emerald-500 text-white font-bold text-sm rounded-full px-4 py-2">
            +{attempts === 1 && !hintUsed ? 10 : hintUsed ? 7 : 5} XP
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-3 pt-1">
        {!answered ? (
          <>
            {hintGentle && !showHint && (
              <button
                onClick={handleHint}
                className="flex-shrink-0 bg-white border-2 border-[#ede8f5] text-[#6B3FA0] py-3.5 px-6 rounded-2xl font-semibold flex items-center gap-2 hover:bg-[#ede8f5] transition-colors"
              >
                <Lightbulb size={17} /> Hint
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="flex-1 bg-[#6B3FA0] text-white py-3.5 px-8 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check answer
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
