const BLOCKED_PATTERNS = [
  /\bviolen(ce|t)\b/i,
  /\bweapon\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[- ]harm\b/i,
  /\bsexual\b/i,
  /\bexplicit\b/i,
  /\bhate\s+speech\b/i,
  /\bdrug\s+use\b/i,
]

export function passesSafetyCheck(text: string): boolean {
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(text))
}

export function contentSafetyCheck(obj: unknown): boolean {
  const text = JSON.stringify(obj)
  return passesSafetyCheck(text)
}
