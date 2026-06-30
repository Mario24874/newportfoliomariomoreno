// Portal admin del portafolio — montado en /admin (sin react-router, ver main.tsx).
// Login Google (Supabase Auth) restringido a tu gmail vía allowlist + RLS.
import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isAdminEmail } from '@/lib/supabase';
import { useMetrics } from './useMetrics';

const C = {
  bg: '#020617', card: '#0f172a', border: '#1e293b', line: '#131c31',
  text: '#f8fafc', sub: '#94a3b8', dim: '#64748b', accent: '#6366f1',
};

export default function AdminApp() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'Admin · Métricas';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    if (!sb) { setReady(true); return; }
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

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

function Dashboard({ email, onOut }: { email: string; onOut: () => void }) {
  const m = useMetrics();
  const fmtDur = (s: number) => (!s ? '0s' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`);
  const maxDay = Math.max(1, ...m.visitsByDay.map((d) => d.visits));

  const kpis = [
    { label: 'Visitas (30d)', value: m.visitsTotal, color: '#60a5fa' },
    { label: 'Visitantes únicos', value: m.uniqueVisitors, color: '#34d399' },
    { label: 'Demos probados', value: m.demosTotal, color: '#a78bfa' },
    { label: 'Tiempo medio', value: fmtDur(m.avgSeconds), color: '#fbbf24' },
    { label: 'Leads scrapeados', value: m.leadsTotal, color: '#22d3ee' },
    { label: 'Respuestas', value: m.replies, color: '#4ade80' },
    { label: 'Contactos', value: m.contactsTotal, color: '#fb923c' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 54, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#0a0f1f', zIndex: 10 }}>
        <strong style={{ fontSize: 15 }}><span style={{ color: C.accent }}>●</span> Admin · Métricas</strong>
        <a href="/" style={{ color: C.dim, fontSize: 13, marginLeft: 8 }}>← Sitio</a>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.dim }}>{email}</span>
        <button onClick={onOut} style={{ fontSize: 12, color: C.sub, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>Salir</button>
      </header>

      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {m.loading && <Note>Cargando métricas…</Note>}
        {m.error && <Note>⚠️ {m.error}</Note>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <Card title="Visitas por día (14d)">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, padding: '4px 0' }}>
            {m.visitsByDay.map((d) => (
              <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
                <div title={`${d.day}: ${d.visits}`} style={{ height: `${(d.visits / maxDay) * 72}px`, minHeight: 2, background: C.accent, borderRadius: 3 }} />
                <span style={{ fontSize: 8, color: C.dim }}>{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Correos recibidos (respuestas)">
          <Table head={['De', 'Asunto', 'Mensaje', 'Fecha']} rows={m.replyRows} empty="Sin respuestas aún (las alimenta n8n → pf_email_replies)." />
        </Card>
        <Card title="Solicitudes del formulario de contacto">
          <Table head={['Nombre', 'Email/Tel', 'Mensaje', 'Fecha']} rows={m.contactRows} empty="Sin solicitudes todavía." />
        </Card>
        <Card title="Leads scrapeados (n8n · outreach_log)">
          <Table head={['Empresa', 'Email', 'Estado', 'Respondió', 'Fecha']} rows={m.leadRows} empty="Sin acceso a outreach_log (activa la policy opcional) o sin leads." />
        </Card>
        <Card title="Visitas anónimas recientes">
          <Table head={['Anon', 'Área', 'Ruta', 'Tiempo', 'Fecha']} rows={m.visitRows} empty="Aún no hay visitas registradas." />
        </Card>
      </div>
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
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0, padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>{title}</h3>
      <div style={{ padding: title ? 14 : 0 }}>{children}</div>
    </div>
  );
}
function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <p style={{ color: C.dim, fontSize: 12.5 }}>{empty}</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead><tr>{head.map((h) => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: C.dim, fontSize: 11, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '6px 8px', color: '#cbd5e1', borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
