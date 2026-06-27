export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/msword",                                                          // doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",   // docx
]

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }

export function validateUpload(file: { size: number; type: string }): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false, error: "Only PDF, PPTX, DOC, and DOCX files are accepted." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "File must be under 20 MB." }
  }
  return { ok: true }
}
