"use client"

import { useState, useRef } from "react"
import { Upload, CheckCircle2, Loader2, Zap, FileText, File, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { TopNav } from "@/components/TopNav"
import Link from "next/link"

type UploadState = "idle" | "dragging" | "processing" | "done" | "error"

const tips = [
  "Works best with slide decks that have bullet points",
  "Clear headings help Claude understand topic structure",
  "PDFs with selectable text work better than scanned images",
]

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { setUploadState("error"); return }
    if (!file.name.match(/\.(pdf|pptx|doc|docx)$/i)) { setUploadState("error"); return }
    setFileName(file.name)
    setUploadState("processing")
    setProgress(0)
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(interval); return 95 }
        return p + Math.random() * 15
      })
    }, 300)
    setTimeout(() => { clearInterval(interval); setProgress(100); setUploadState("done") }, 3500)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setUploadState("idle")
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <TopNav />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a0f2e] mb-2">Add material</h1>
          <p className="text-gray-500">Upload a lesson file and we'll turn it into personalised practice activities.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Drop zone — 3/5 width */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div
              onDragOver={(e) => { e.preventDefault(); if (uploadState === "idle") setUploadState("dragging") }}
              onDragLeave={() => { if (uploadState === "dragging") setUploadState("idle") }}
              onDrop={handleDrop}
              onClick={() => (uploadState === "idle" || uploadState === "dragging") && inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-5 cursor-pointer transition-all duration-200 min-h-[280px] p-10",
                (uploadState === "idle") && "border-[#c4a9e8] bg-white hover:bg-[#f9f6ff] hover:border-[#6B3FA0]",
                uploadState === "dragging" && "border-[#6B3FA0] bg-[#f3eeff] scale-[1.01]",
                uploadState === "processing" && "border-[#6B3FA0] bg-white cursor-default",
                uploadState === "done" && "border-emerald-400 bg-emerald-50 cursor-default",
                uploadState === "error" && "border-red-300 bg-red-50 cursor-default",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.pptx,.doc,.docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />

              {(uploadState === "idle" || uploadState === "dragging") && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[#ede8f5] flex items-center justify-center">
                    <Upload size={30} className="text-[#6B3FA0]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1a0f2e] mb-1">Drop your file here</p>
                    <p className="text-gray-400">or click to browse</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {["PDF", "PPTX", "Word"].map((f) => (
                      <span key={f} className="text-xs font-medium text-[#6B3FA0] bg-[#ede8f5] rounded-full px-3 py-1">{f}</span>
                    ))}
                    <span className="text-xs text-gray-400">· up to 20MB</span>
                  </div>
                </>
              )}

              {uploadState === "processing" && (
                <>
                  <Loader2 size={44} className="text-[#6B3FA0] animate-spin" />
                  <div className="text-center w-full max-w-xs">
                    <p className="text-lg font-bold text-[#6B3FA0] mb-1">Creating activities…</p>
                    <p className="text-sm text-gray-400 mb-4">{fileName}</p>
                    <div className="w-full bg-[#ede8f5] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6B3FA0] to-[#e8439b] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Claude is reading your file…</p>
                  </div>
                </>
              )}

              {uploadState === "done" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-700 mb-1">Activities ready! 🎉</p>
                    <p className="text-sm text-emerald-600">{fileName}</p>
                  </div>
                </>
              )}

              {uploadState === "error" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle size={36} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-red-700 mb-1">Couldn't read that file</p>
                    <p className="text-sm text-red-500">Please upload a PDF, PPTX, or Word doc under 20MB</p>
                  </div>
                </>
              )}
            </div>

            {/* CTAs after done/error */}
            {uploadState === "done" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/child/home" className="flex-1 bg-[#6B3FA0] text-white py-3.5 rounded-2xl text-center font-bold hover:bg-[#4a2970] transition-colors">
                  Start playing now →
                </Link>
                <button onClick={() => { setUploadState("idle"); setFileName(null); setProgress(0) }} className="flex-1 bg-white text-[#6B3FA0] border-2 border-[#6B3FA0] py-3.5 rounded-2xl font-semibold hover:bg-[#ede8f5] transition-colors">
                  Upload another file
                </button>
              </div>
            )}
            {uploadState === "error" && (
              <button onClick={() => { setUploadState("idle"); setFileName(null) }} className="w-full bg-[#6B3FA0] text-white py-3.5 rounded-2xl font-bold hover:bg-[#4a2970] transition-colors">
                Try again
              </button>
            )}
          </div>

          {/* Right sidebar — tips */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">What works well</p>
              <div className="flex flex-col gap-3">
                {tips.map((tip) => (
                  <div key={tip} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ede8f5] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#6B3FA0] text-xs font-bold">✓</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#f9f6ff] border border-[#ede8f5] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-[#e8439b]" />
                <p className="text-sm font-bold text-[#6B3FA0]">Ready in under a minute</p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Claude reads your file, extracts the key concepts, and generates 20+ practice activities tailored to your child's year level.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Accepted file types</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: FileText, label: "PDF", sub: "Any PDF with selectable text" },
                  { icon: File, label: "PPTX", sub: "PowerPoint presentations" },
                  { icon: FileText, label: "Word", sub: ".doc and .docx files" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ede8f5] flex items-center justify-center">
                      <Icon size={14} className="text-[#6B3FA0]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a0f2e]">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
