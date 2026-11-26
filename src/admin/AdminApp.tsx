// Portal admin del portafolio — montado en /admin (sin react-router, ver main.tsx).
// Login Google (Supabase Auth) restringido a tu gmail vía allowlist + RLS.
import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isAdminEmail } from '@/lib/supabase';
import { setTokenGetter, useApi, type Live, type Range, type Summary } from './api';
import { AvisosView, CaptacionView, DemosView, Mensajes, Resumen, SaludView, Trafico } from './views';
import { T } from './theme';

const C = {
  bg: T.page, card: T.card, border: T.border, line: T.grid,
  text: T.text, sub: T.sub, dim: T.muted, accent: T.accent,
};
// Vista previa SOLO en desarrollo (npm run dev + ?mock): datos simulados y sin login. En producción esta rama no existe (se elimina al compilar).
const MOCK = import.meta.env.DEV && location.search.includes('mock');

export default function AdminApp() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'Admin · Portfolio';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    if (MOCK) { setReady(true); return; }
    if (!sb) { setReady(true); return; }
    setTokenGetter(async () => (await sb.auth.getSession()).data.session?.access_token ?? null);
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  if (MOCK) return <Dashboard email="vista-previa@local" onOut={() => undefined} />;
  if (!sb) return <Shell><Note>Supabase no está configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).</Note></Shell>;
  if (!ready) return <Shell><Note>Cargando…</Note></Shell>;

  const email = session?.user?.email;
  if (!session) return <Shell><Login /></Shell>;
  if (!isAdminEmail(email)) return <Shell><Denied email={email} onOut={() => sb.auth.signOut()} /></Shell>;

  return <Dashboard email={email!} onOut={() => sb.auth.signOut()} />;
}

function Login() {
  const sb = getSupabase()!;
  const [err, setErr] = useState('');
  async function google() {
    setErr('');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/admin` },
    });
    if (error) setErr(error.message);
  }
  return (
    <div style={{ width: 340, padding: 28, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Panel de métricas</h1>
      <p style={{ fontSize: 13, color: C.dim, margin: '0 0 20px' }}>Acceso privado · solo el owner</p>
      <button onClick={google} style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#fff', color: '#1f2937', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
        Entrar con Google
      </button>
      {err && <p style={{ color: '#fb7185', fontSize: 12, marginTop: 12 }}>{err}</p>}
    </div>
  );
}

function Denied({ email, onOut }: { email?: string; onOut: () => void }) {
  return (
    <div style={{ width: 360, padding: 28, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>🔒</div>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '8px 0 4px' }}>Acceso no autorizado</h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>{email} no tiene permiso para este panel.</p>
      <button onClick={onOut} style={{ padding: '8px 16px', borderRadius: 8, background: C.border, color: C.text, border: 'none', cursor: 'pointer', fontSize: 13 }}>Cerrar sesión</button>
    </div>
  );
}

const TABS = ['Resumen', 'Tráfico', 'Demos IA', 'Mensajes', 'Captación', 'Salud', 'Avisos'] as const;
type Tab = (typeof TABS)[number];
const RANGES: [Range, string][] = [['24h', 'Últimas 24 h'], ['7d', '7 días'], ['30d', '30 días'], ['90d', '90 días']];

function Dashboard({ email, onOut }: { email: string; onOut: () => void }) {
  const [tab, setTab] = useState<Tab>('Resumen');
  const [range, setRange] = useState<Range>('7d');
  const live = useApi<Live>('/admin/live', {}, 10000);
  const sum = useApi<Summary>('/admin/summary', { range: '7d' }, 60000);
  const unread = sum.data?.kpis.unread.v ?? 0;
  const ranged = tab === 'Resumen' || tab === 'Tráfico' || tab === 'Demos IA';
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: T.font, overflowX: 'hidden' }}>
      <style>{`.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}@media(max-width:900px){.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
        button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid ${T.accent};outline-offset:2px}`}</style>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: '#161615', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 54, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 15 }}><span style={{ color: C.accent }}>●</span> Admin · Portfolio</strong>
          <a href="/" style={{ color: C.dim, fontSize: 13 }}>← Sitio</a>
          <span title="Visitantes distintos en los últimos 5 minutos" style={{ marginLeft: 'auto', fontSize: 12.5, color: T.sub, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: (live.data?.active_5min ?? 0) > 0 ? T.good : T.muted }} />
            {live.data ? `${live.data.active_5min} en vivo` : '…'}
          </span>
          <span style={{ fontSize: 12, color: C.dim }}>{email}</span>
          <button onClick={onOut} style={{ fontSize: 12, color: C.sub, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>Salir</button>
        </div>
        <nav aria-label="Secciones" style={{ display: 'flex', gap: 2, padding: '0 14px', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-current={tab === t ? 'page' : undefined}
              style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`, color: tab === t ? C.text : C.dim, padding: '10px 12px', fontSize: 13.5, fontWeight: tab === t ? 650 : 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: T.font }}>
              {t}{t === 'Mensajes' && unread > 0 && <span style={{ marginLeft: 6, background: C.accent, color: '#fff', borderRadius: 9, fontSize: 11, padding: '1px 6px' }}>{unread}</span>}
            </button>
          ))}
        </nav>
      </header>
      <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {ranged && (
          <div role="group" aria-label="Rango de fechas" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {RANGES.map(([v, l]) => <button key={v} onClick={() => setRange(v)} aria-pressed={range === v} style={{ background: range === v ? T.raised : 'transparent', color: range === v ? C.text : C.sub, border: `1px solid ${range === v ? C.accent : C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 13, cursor: 'pointer', fontFamily: T.font }}>{l}</button>)}
          </div>
        )}
        {tab === 'Resumen' && <Resumen range={range} />}
        {tab === 'Tráfico' && <Trafico range={range} />}
        {tab === 'Demos IA' && <DemosView range={range} />}
        {tab === 'Mensajes' && <Mensajes />}
        {tab === 'Captación' && <CaptacionView />}
        {tab === 'Salud' && <SaludView />}
        {tab === 'Avisos' && <AvisosView />}
      </main>
    </div>
  );
}

// ---- UI helpers ----
function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>{children}</div>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ color: C.dim, fontSize: 13, padding: 16 }}>{children}</p>;
}
