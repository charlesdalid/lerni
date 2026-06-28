import type { SupabaseClient } from "@supabase/supabase-js"

export async function recordParentalConsent(
  supabase: SupabaseClient,
  familyId: string,
  childId: string | null,
  headers: Headers,
) {
  const ip = headers.get("x-forwarded-for") ?? "unknown"
  const userAgent = headers.get("user-agent") ?? "unknown"

  const { error } = await supabase.from("consent_records").insert({
    family_id: familyId,
    child_id: childId,
    consent_type: "coppa_data_collection",
    ip_address: ip,
    user_agent: userAgent,
  })

  if (error) throw new Error(`Failed to record consent: ${error.message}`)
}
