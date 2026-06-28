// pdf-parse only has a CJS default export; use dynamic require at runtime
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(buffer)
  const text = data.text.trim()

  if (!text) {
    throw new Error(
      "No text could be extracted from this PDF. It may be a scanned image — please use a PDF with selectable text.",
    )
  }

  return text
}
