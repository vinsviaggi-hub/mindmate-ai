import { supabaseServer } from './server'

export async function getStats() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Crea i record base se non esistono (idempotente)
  await supabase.from('profiles').insert({ id: user.id }).select().maybeSingle().catch(()=>{})
  await supabase.from('user_stats').insert({ user_id: user.id }).select().maybeSingle().catch(()=>{})

  // Ritorna le statistiche
  const { data } = await supabase
    .from('user_stats')
    .select('current_streak,longest_streak,coins,last_checkin')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}
