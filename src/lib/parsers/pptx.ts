// officeparser v7 returns an AST; we stringify the text nodes
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseOffice } = require("officeparser") as {
  parseOffice: (
    file: Buffer,
    callback: (ast: unknown, err?: Error) => void,
  ) => void
}

export async function extractOfficeText(buffer: Buffer, filename: string): Promise<string> {
  const ast = await new Promise<unknown>((resolve, reject) => {
    parseOffice(buffer, (result: unknown, err?: Error) => {
      if (err) reject(err)
      else resolve(result)
    })
  })

  // The AST is either a string or an object; JSON stringify and strip markup
  const raw = typeof ast === "string" ? ast : JSON.stringify(ast)
  const trimmed = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

  if (!trimmed) {
    throw new Error(
      `No text could be extracted from "${filename}". Please check the file is not empty or corrupted.`,
    )
  }

  return trimmed
}
