// Run with: node scripts/test-supabase.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// Parse .env.local manually (no dotenv dependency needed)
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("=").map((s) => s.trim()))
)

const url = env["NEXT_PUBLIC_SUPABASE_URL"]
const key = env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]

if (!url || !key) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local")
  process.exit(1)
}

console.log("🔗  Connecting to:", url)

const supabase = createClient(url, key)

// Hit a lightweight endpoint — just fetch the Supabase health/version
const { error } = await supabase.from("_test_connection_").select("*").limit(1)

// A "relation does not exist" error means we connected successfully —
// the table just doesn't exist yet, which is expected.
if (
  error?.code === "42P01" ||
  error?.message?.includes("does not exist") ||
  error?.message?.includes("schema cache")
) {
  console.log("✅  Supabase connection successful! (no tables yet — that's expected)")
} else if (!error) {
  console.log("✅  Supabase connection successful!")
} else {
  console.error("❌  Connection error:", error.message)
  process.exit(1)
}
