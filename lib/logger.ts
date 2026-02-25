import { createClient } from './supabase-client';

export async function logActivity(
  action: string,
  details: Record<string, any>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Buscar o nome do perfil (se existir)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const userName = profile?.name || null;

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    user_name: userName,  // novo campo
    action,
    details,
  });
}