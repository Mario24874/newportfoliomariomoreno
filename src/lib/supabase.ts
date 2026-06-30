// Cliente Supabase del PORTAFOLIO (instancia compartida con outreach-tracker,
// pero el portafolio solo toca sus propias tablas pf_* vía RLS).
// Solo se usa la anon key (pública, segura en el navegador). Nunca la service_role.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

/** Devuelve el cliente Supabase, o null si no está configurado (no rompe el SPA). */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !anonKey) {
    if (import.meta.env.DEV) console.warn('[supabase] VITE_SUPABASE_URL/ANON_KEY no configuradas');
    return null;
  }
  _client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'marioivanmorenopineda@gmail.com')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
