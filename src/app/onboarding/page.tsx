"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

const YEAR_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const INTEREST_OPTIONS = [
  "Sports", "Music", "Art", "Science", "Animals", "Space",
  "Cooking", "Gaming", "Reading", "Dance", "Nature", "History",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [yearLevel, setYearLevel] = useState<number | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!yearLevel) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .single()

    if (!family) {
      router.push("/consent")
      return
    }

    const { error: childError } = await supabase.from("children").insert({
      family_id: family.id,
      name: name.trim(),
      year_level: yearLevel,
      interests: interests.length > 0 ? interests : null,
    })

    if (childError) {
      setError("Failed to create child profile. Please try again.")
      setLoading(false)
      return
    }

    router.push("/parent/dashboard")
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#1a0f2e]">Add your child</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8">
          You can add more children later from the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1a0f2e] mb-1.5">
              Child&apos;s first name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3FA0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a0f2e] mb-3">Year level</label>
            <div className="grid grid-cols-6 gap-2">
              {YEAR_LEVELS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setYearLevel(yr)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    yearLevel === yr
                      ? "bg-[#6B3FA0] text-white border-[#6B3FA0]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#6B3FA0] hover:text-[#6B3FA0]"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a0f2e] mb-1">
              Interests{" "}
              <span className="text-gray-400 font-normal">(optional — helps personalise activities)</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-3">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    interests.includes(interest)
                      ? "bg-[#ede8f5] text-[#6B3FA0] border-[#6B3FA0]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#6B3FA0]"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || !yearLevel || loading}
            className="w-full bg-[#6B3FA0] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Let's go →"}
          </button>
        </form>
      </div>
    </div>
  )
}
