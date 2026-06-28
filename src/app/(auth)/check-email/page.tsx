import { Mail } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white rounded-2xl shadow-sm p-10">
        <div className="w-16 h-16 rounded-2xl bg-[#ede8f5] flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-[#6B3FA0]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a0f2e] mb-3">Check your email</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          We sent a confirmation link to your email address. Click it to verify your account and continue setting up Lerni.
        </p>
        <p className="text-xs text-gray-300">
          Wrong email?{" "}
          <Link href="/signup" className="text-[#6B3FA0] hover:underline">
            Start over
          </Link>
        </p>
      </div>
    </div>
  )
}
