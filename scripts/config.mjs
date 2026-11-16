export function publicConfig(env) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Falten SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('URL Supabase no vàlida.');
  let allowed = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!allowed && key.split('.').length === 3) {
    try { allowed = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {}
  }
  if (!allowed) throw new Error('Utilitza una clau publishable o anon, mai una clau secreta.');
  return { url: parsed.origin, key };
}
