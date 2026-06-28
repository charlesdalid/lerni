import Link from "next/link"
import { BookOpen, BarChart2, Upload, Zap, Lock, RefreshCw } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#e8e0f5] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B3FA0] to-[#e8439b] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1a0f2e]">Lerni</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm font-medium text-[#6B3FA0] border border-[#6B3FA0] px-5 py-2 rounded-full hover:bg-[#ede8f5] transition-colors">
            Log in
          </Link>
          <Link href="/login" className="text-sm font-medium bg-[#6B3FA0] text-white px-5 py-2 rounded-full hover:bg-[#4a2970] transition-colors">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e8e0f5] rounded-full px-4 py-1.5 text-sm text-[#6B3FA0] font-medium mb-6">
            <Zap size={14} className="text-[#e8439b]" /> AI-powered · Built for ages 6–14
          </div>
          <h1 className="text-5xl font-extrabold text-[#1a0f2e] leading-tight mb-5">
            Turn school slides into<br />
            <span className="text-[#6B3FA0]">games your child loves</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Upload a lesson PDF or PPTX. We generate practice activities matched exactly to what your child is learning this week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="bg-[#6B3FA0] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#4a2970] transition-colors shadow-lg shadow-purple-200">
              Get started for free →
            </Link>
            <Link href="/login" className="bg-white text-[#6B3FA0] border-2 border-[#6B3FA0] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#ede8f5] transition-colors">
              See demo
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            { icon: Upload, title: "Upload any format", body: "PDF, PPTX, or Word doc. We extract the content and do the rest." },
            { icon: Zap, title: "Ready in under a minute", body: "Claude AI turns your upload into 20+ practice activities instantly." },
            { icon: BarChart2, title: "Track every concept", body: "See exactly which topics your child has mastered vs needs more time on." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#ede8f5] flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#6B3FA0]" />
              </div>
              <h3 className="font-bold text-[#1a0f2e] mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
