import { getSupabaseSession } from './lib/supabase-session'
// Import `supabase` dari file client Anda

const session = await getSupabaseSession(supabase)

export async function getSupabaseSession(
  supabase: SupabaseClient,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}


