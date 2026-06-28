"use client"

import Link from "next/link"
import { BookOpen, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function TopNav() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-[#ede8f5] px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold text-[#1a0f2e]">Lerni</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/child/home"
          className="text-sm font-medium bg-[#6B3FA0] text-white px-4 py-1.5 rounded-full hover:bg-[#4a2970] transition-colors"
        >
          Child view
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </nav>
  )
}
