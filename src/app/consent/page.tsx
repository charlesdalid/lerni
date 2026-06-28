"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Shield, CheckCircle2 } from "lucide-react"

const CONSENT_POINTS = [
  "Your child's name, year level, and learning progress will be stored securely.",
  "School documents you upload are used only to generate practice activities for your child.",
  "We do not share or sell your child's data to any third parties.",
  "You can delete your account and all associated data at any time.",
  "Lerni complies with the Children's Online Privacy Protection Act (COPPA).",
]

export default function ConsentPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConsent() {
    if (!agreed) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Create the family record
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({ user_id: user.id })
      .select("id")
      .single()

    if (familyError || !family) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
      return
    }

    // Record COPPA consent
    const { error: consentError } = await supabase.from("consent_records").insert({
      family_id: family.id,
      child_id: null,
      consent_type: "coppa_data_collection",
      // IP + user agent recorded server-side in the API route for real consent logs
    })

    if (consentError) {
      setError("Failed to record consent. Please try again.")
      setLoading(false)
      return
    }

    router.push("/onboarding")
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#ede8f5] flex items-center justify-center">
            <Shield size={20} className="text-[#6B3FA0]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a0f2e]">Parental consent</h1>
            <p className="text-xs text-gray-400">Required before creating any child profiles</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Because Lerni is designed for children, we are required by law (COPPA) to get your
          explicit consent before collecting any information about your child. Please read the
          following carefully.
        </p>

        <div className="bg-[#f9f7fe] border border-[#e8e0f5] rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-[#6B3FA0] uppercase tracking-wider mb-3">
            By continuing you agree that:
          </p>
          <ul className="flex flex-col gap-3">
            {CONSENT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-[#6B3FA0] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#6B3FA0] cursor-pointer"
          />
          <span className="text-sm text-[#1a0f2e] leading-relaxed">
            I am the parent or legal guardian and I consent to the collection and use of my
            child&apos;s data as described above.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleConsent}
          disabled={!agreed || loading}
          className="w-full bg-[#6B3FA0] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Setting up your account…" : "I agree — continue"}
        </button>
      </div>
    </div>
  )
}
