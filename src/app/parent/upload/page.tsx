"use client"

import { useState, useRef, useEffect } from "react"
import {
  Upload,
  CheckCircle2,
  Loader2,
  Zap,
  FileText,
  File,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TopNav } from "@/components/TopNav"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type UploadState = "idle" | "dragging" | "uploading" | "processing" | "done" | "error"

const SUBJECTS = [
  "Mathematics", "English", "Science", "History", "Geography",
  "PDHPE", "Art", "Music", "Technology", "Other",
]

const YEAR_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const tips = [
  "Works best with slide decks that have bullet points",
  "Clear headings help Claude understand topic structure",
  "PDFs with selectable text work better than scanned images",
]

interface Child {
  id: string
  name: string
  year_level: number
}

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [subject, setSubject] = useState("")
  const [yearLevel, setYearLevel] = useState<number | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("children")
      .select("id, name, year_level")
      .then(({ data }) => {
        if (data?.length) {
          setChildren(data)
          setSelectedChild(data[0])
          setYearLevel(data[0].year_level)
        }
      })
  }, [])

  // Auto-fill year level when child changes
  useEffect(() => {
    if (selectedChild) setYearLevel(selectedChild.year_level)
  }, [selectedChild])

  // Poll document status while processing
  useEffect(() => {
    if (uploadState !== "processing" || !documentId) return

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/documents/${documentId}/status`)
      if (!res.ok) return
      const { data } = await res.json()

      if (data.status === "ready") {
        clearInterval(pollRef.current!)
        setUploadState("done")
      } else if (data.status === "failed") {
        clearInterval(pollRef.current!)
        setErrorMessage(data.error_message ?? "Processing failed. Please try again.")
        setUploadState("error")
      }
    }, 3000)

    return () => clearInterval(pollRef.current!)
  }, [uploadState, documentId])

  const handleFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("File must be under 20MB.")
      setUploadState("error")
      return
    }
    if (!file.name.match(/\.(pdf|pptx|doc|docx)$/i)) {
      setErrorMessage("Only PDF, PPTX, DOC, and DOCX files are accepted.")
      setUploadState("error")
      return
    }
    setFileName(file.name)
    setPendingFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setUploadState("idle")
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingFile || !selectedChild || !subject || !yearLevel) return

    setUploadState("uploading")
    setErrorMessage(null)

    const formData = new FormData()
    formData.append("file", pendingFile)
    formData.append(
      "meta",
      JSON.stringify({ childId: selectedChild.id, subject, yearLevel }),
    )

    try {
      const res = await fetch("/api/documents/process", { method: "POST", body: formData })
      const json = await res.json()

      if (!res.ok || json.error) {
        setErrorMessage(json.error?.message ?? "Upload failed. Please try again.")
        setUploadState("error")
        return
      }

      setDocumentId(json.data.documentId)
      setUploadState("processing")
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.")
      setUploadState("error")
    }
  }

  function reset() {
    setUploadState("idle")
    setFileName(null)
    setErrorMessage(null)
    setPendingFile(null)
    setDocumentId(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const isIdle = uploadState === "idle" || uploadState === "dragging"
  const isWorking = uploadState === "uploading" || uploadState === "processing"
  const readyToSubmit = !!pendingFile && !!selectedChild && !!subject && !!yearLevel

  return (
    <div className="min-h-screen bg-[#ede8f5] flex flex-col">
      <TopNav />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a0f2e] mb-2">Add material</h1>
          <p className="text-gray-500">
            Upload a lesson file and we&apos;ll turn it into personalised practice activities.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Drop zone */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  if (isIdle) setUploadState("dragging")
                }}
                onDragLeave={() => {
                  if (uploadState === "dragging") setUploadState("idle")
                }}
                onDrop={handleDrop}
                onClick={() => isIdle && !pendingFile && inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-5 transition-all duration-200 min-h-[260px] p-10",
                  isIdle && !pendingFile &&
                    "border-[#c4a9e8] bg-white hover:bg-[#f9f6ff] hover:border-[#6B3FA0] cursor-pointer",
                  uploadState === "dragging" &&
                    "border-[#6B3FA0] bg-[#f3eeff] scale-[1.01] cursor-pointer",
                  pendingFile && isIdle &&
                    "border-[#6B3FA0] bg-[#f9f6ff] cursor-default",
                  isWorking && "border-[#6B3FA0] bg-white cursor-default",
                  uploadState === "done" && "border-emerald-400 bg-emerald-50 cursor-default",
                  uploadState === "error" && "border-red-300 bg-red-50 cursor-default",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.pptx,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />

                {isIdle && !pendingFile && (
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
                        <span
                          key={f}
                          className="text-xs font-medium text-[#6B3FA0] bg-[#ede8f5] rounded-full px-3 py-1"
                        >
                          {f}
                        </span>
                      ))}
                      <span className="text-xs text-gray-400">· up to 20MB</span>
                    </div>
                  </>
                )}

                {isIdle && pendingFile && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-[#ede8f5] flex items-center justify-center">
                      <FileText size={30} className="text-[#6B3FA0]" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-[#1a0f2e] mb-1">{pendingFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); reset() }}
                        className="text-sm text-gray-400 hover:text-red-500 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}

                {isWorking && (
                  <>
                    <Loader2 size={44} className="text-[#6B3FA0] animate-spin" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#6B3FA0] mb-1">
                        {uploadState === "uploading" ? "Uploading…" : "Claude is creating activities…"}
                      </p>
                      <p className="text-sm text-gray-400">{fileName}</p>
                      {uploadState === "processing" && (
                        <p className="text-xs text-gray-400 mt-2">Usually takes 30–60 seconds</p>
                      )}
                    </div>
                  </>
                )}

                {uploadState === "done" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-700 mb-1">
                        Activities ready! 🎉
                      </p>
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
                      <p className="text-base font-bold text-red-700 mb-1">Something went wrong</p>
                      <p className="text-sm text-red-500">{errorMessage}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Meta fields */}
              {!isWorking && uploadState !== "done" && (
                <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  {children.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        For
                      </label>
                      <div className="relative">
                        <select
                          value={selectedChild?.id ?? ""}
                          onChange={(e) => {
                            const c = children.find((ch) => ch.id === e.target.value)
                            if (c) setSelectedChild(c)
                          }}
                          className="w-full appearance-none bg-[#f9f7fe] border border-[#e8e0f5] rounded-xl px-4 py-2.5 text-sm font-medium text-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
                        >
                          {children.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (Year {c.year_level})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full appearance-none bg-[#f9f7fe] border border-[#e8e0f5] rounded-xl px-4 py-2.5 text-sm text-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
                        >
                          <option value="">Select…</option>
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Year Level
                      </label>
                      <div className="relative">
                        <select
                          value={yearLevel ?? ""}
                          onChange={(e) => setYearLevel(Number(e.target.value))}
                          className="w-full appearance-none bg-[#f9f7fe] border border-[#e8e0f5] rounded-xl px-4 py-2.5 text-sm text-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
                        >
                          <option value="">Select…</option>
                          {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>Year {y}</option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit / done / error CTAs */}
              {isIdle && (
                <button
                  type="submit"
                  disabled={!readyToSubmit}
                  className="w-full bg-[#6B3FA0] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#4a2970] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-200"
                >
                  Generate activities →
                </button>
              )}

              {uploadState === "done" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/child/home"
                    className="flex-1 bg-[#6B3FA0] text-white py-3.5 rounded-2xl text-center font-bold hover:bg-[#4a2970] transition-colors"
                  >
                    Start playing now →
                  </Link>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 bg-white text-[#6B3FA0] border-2 border-[#6B3FA0] py-3.5 rounded-2xl font-semibold hover:bg-[#ede8f5] transition-colors"
                  >
                    Upload another
                  </button>
                </div>
              )}

              {uploadState === "error" && (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full bg-[#6B3FA0] text-white py-4 rounded-2xl font-bold hover:bg-[#4a2970] transition-colors"
                >
                  Try again
                </button>
              )}
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">
                  What works well
                </p>
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
                  Claude reads your file, extracts the key concepts, and generates 20+ practice
                  activities tailored to your child&apos;s year level.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">
                  Accepted file types
                </p>
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
        </form>
      </div>
    </div>
  )
}
