import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <nav className="bg-white border-b border-[#e8e0f5] px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1a0f2e]">Lerni</span>
        </Link>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
