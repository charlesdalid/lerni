import type { SupabaseClient } from "@supabase/supabase-js"

export async function validateChildAccess(
  supabase: SupabaseClient,
  childId: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: child } = await supabase
    .from("children")
    .select("id, family_id, families!inner(user_id)")
    .eq("id", childId)
    .single()

  // @ts-expect-error: Supabase join type is not fully inferred
  return child?.families?.user_id === user.id
}
