import type { Session, SupabaseClient } from '@supabase/supabase-js'

export async function getSupabaseSession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}



