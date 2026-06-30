// Analítica del portafolio → Supabase propia (tablas pf_*), vía REST + anon key.
// Usa fetch plano (NO el SDK supabase-js) para no inflar el bundle público:
// el SDK pesado solo se carga en el chunk de /admin. La seguridad la da el RLS
// (anon solo puede INSERT en pf_*; nadie lee desde el navegador).
// Reemplaza el viejo trackVisit() que enviaba a app.mariomoreno.work (outreach-tracker).

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const COOKIE = 'mm_visitor';

function rest(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  if (!URL || !ANON) return Promise.resolve(null);
  return fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  }).catch(() => null);
}

/** ID anónimo persistente, compartido en .mariomoreno.work (portfolio + app). */
export function anonId(): string {
  try {
    const m = document.cookie.match(/(?:^|;\s*)mm_visitor=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
    const id = crypto.randomUUID();
    const exp = new Date(Date.now() + 365 * 864e5).toUTCString();
    document.cookie = `${COOKIE}=${id};domain=.mariomoreno.work;path=/;expires=${exp};SameSite=Lax;Secure`;
    return id;
  } catch {
    return 'anon';
  }
}

let viewId: string | null = null;
let t0 = 0;

/** Registra una visita y arranca el cronómetro de permanencia. */
export async function trackPageview(area: 'portfolio' | 'app' = 'portfolio'): Promise<void> {
  if (!URL || !ANON) return;
  if (sessionStorage.getItem('pv_sent')) return;
  sessionStorage.setItem('pv_sent', '1');
  t0 = Date.now();
  try {
    const res = await rest('pf_page_views', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        anon_id: anonId(),
        area,
        path: location.pathname || '/',
        section: document.title ? document.title.slice(0, 120) : null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 512),
      }),
    });
    const rows = res && res.ok ? await res.json().catch(() => null) : null;
    viewId = Array.isArray(rows) && rows[0]?.id ? rows[0].id : null;
    if (viewId) {
      const flush = () => {
        if (!viewId) return;
        const dur = Math.round((Date.now() - t0) / 1000);
        viewId = null;
        if (dur < 1) return;
        // keepalive para que el PATCH sobreviva al cierre de la pestaña
        rest(`pf_page_views?id=eq.${viewId}`, {
          method: 'PATCH',
          body: JSON.stringify({ duration_seconds: dur }),
          keepalive: true,
        } as RequestInit);
      };
      addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      addEventListener('pagehide', flush);
    }
  } catch {
    /* la analítica nunca debe romper el sitio */
  }
}

/** Registra que un visitante probó un demo/agente de IA. */
export async function trackDemo(demo: string, input?: string): Promise<void> {
  if (!demo) return;
  await rest('pf_demo_runs', {
    method: 'POST',
    body: JSON.stringify({ anon_id: anonId(), demo, input_preview: input ? input.slice(0, 280) : null }),
  });
}

/** Guarda un mensaje del formulario de contacto del portfolio. */
export async function saveContactMessage(msg: {
  name?: string; email?: string; phone?: string; message?: string;
}): Promise<boolean> {
  const res = await rest('pf_contact_messages', {
    method: 'POST',
    body: JSON.stringify({
      name: msg.name ?? null,
      email: msg.email ?? null,
      phone: msg.phone ?? null,
      message: msg.message ?? null,
      source: 'portfolio',
      anon_id: anonId(),
    }),
  });
  return !!res && res.ok;
}
