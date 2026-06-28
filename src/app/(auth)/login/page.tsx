"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Mail, KeyRound } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep("otp")
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      setError("Incorrect code. Please check your email and try again.")
      setLoading(false)
      return
    }

    // Check if new user (no family yet) → onboarding
    const { data: family } = await supabase.from("families").select("id").single()

    if (!family) {
      router.push("/consent")
    } else {
      router.push("/parent/dashboard")
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        {step === "email" ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#ede8f5] flex items-center justify-center mb-5">
              <Mail size={22} className="text-[#6B3FA0]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a0f2e] mb-1">Sign in to Lerni</h1>
            <p className="text-sm text-gray-400 mb-8">
              Enter your email and we&apos;ll send you a one-time code. No password needed.
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a0f2e] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3FA0] focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B3FA0] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#4a2970] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Sending code…" : "Send code →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#ede8f5] flex items-center justify-center mb-5">
              <KeyRound size={22} className="text-[#6B3FA0]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a0f2e] mb-1">Enter your code</h1>
            <p className="text-sm text-gray-400 mb-8">
              We sent a 6-digit code to <span className="font-medium text-[#1a0f2e]">{email}</span>.
            </p>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a0f2e] mb-1.5">
                  One-time code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-center tracking-[0.4em] font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#6B3FA0] focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || token.length < 6}
                className="w-full bg-[#6B3FA0] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#4a2970] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Verifying…" : "Verify code"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setToken(""); setError(null) }}
                className="text-sm text-gray-400 hover:text-[#6B3FA0] transition-colors text-center"
              >
                ← Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
