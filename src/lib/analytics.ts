// Analítica del portafolio → colector propio en el VPS (t.mariomoreno.work, código en ops/collector) → tablas pf_* de Supabase.
// Antes escribía a Supabase con la anon key por REST; el INSERT con `return=representation` y el PATCH de duración chocaban con RLS (0 visitas
// guardadas, ver docs/ADMIN-V2-AUDITORIA-Y-DISENO.md H1/H2). El colector guarda con service_role, añade el país (Cloudflare), filtra bots y no guarda IP.
// fetch/sendBeacon planos (sin SDK) para no inflar el bundle público; la analítica nunca debe romper el sitio.

const COLLECTOR = ((import.meta.env.VITE_COLLECTOR_URL as string | undefined) || 'https://t.mariomoreno.work').replace(/\/$/, '');
const COOKIE = 'mm_visitor';

// Content-Type text/plain: "petición simple" de CORS (sin preflight); el colector parsea el JSON igualmente.
function send(path: string, payload: unknown, keepalive = false): Promise<Response | null> {
  return fetch(`${COLLECTOR}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    keepalive,
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
    return `anon-${Math.random().toString(36).slice(2, 10)}`;
  }
}

let viewId: string | null = null;
let t0 = 0;

/** Registra una visita y arranca el cronómetro de permanencia. */
export async function trackPageview(area: 'portfolio' | 'app' = 'portfolio'): Promise<void> {
  if (sessionStorage.getItem('pv_sent')) return;
  sessionStorage.setItem('pv_sent', '1');
  t0 = Date.now();
  try {
    const res = await send('/t/pv', {
      anon_id: anonId(),
      area,
      path: `${location.pathname || '/'}${location.search || ''}`.slice(0, 200), // incluye ?utm_… para saber la fuente
      section: document.title ? document.title.slice(0, 120) : null,
      referrer: document.referrer || null,
    });
    const body = res && res.ok && res.status === 200 ? await res.json().catch(() => null) : null;
    viewId = body && typeof body.id === 'string' ? body.id : null;
    if (viewId) {
      const flush = () => {
        const id = viewId;
        if (!id) return;
        const dur = Math.round((Date.now() - t0) / 1000);
        viewId = null;
        if (dur < 1) return;
        const data = JSON.stringify({ id, anon_id: anonId(), seconds: dur });
        // sendBeacon sobrevive al cierre de la pestaña; keepalive como respaldo
        if (!(navigator.sendBeacon && navigator.sendBeacon(`${COLLECTOR}/t/dur`, new Blob([data], { type: 'text/plain' })))) {
          fetch(`${COLLECTOR}/t/dur`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: data, keepalive: true }).catch(() => {});
        }
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
  await send('/t/demo', { anon_id: anonId(), demo, input_preview: input ? input.slice(0, 280) : null });
}

/** Avisa (n8n → Telegram) de que un demo falló para un visitante. Los límites de uso (429) no cuentan como fallo. Nunca rompe el sitio. */
export function reportDemoFailure(demo: string, detail: string, status?: number): void {
  try {
    if (!demo || status === 429) return;
    fetch('/proxy/n8n/webhook/demo-fail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo, detail: String(detail).slice(0, 200), status: status ?? null, page: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* el reporte nunca debe romper el sitio */
  }
}

/** Guarda un mensaje del formulario de contacto del portfolio. */
export async function saveContactMessage(msg: {
  name?: string; email?: string; phone?: string; message?: string;
}): Promise<boolean> {
  const res = await send('/t/contact', {
    name: msg.name ?? null,
    email: msg.email ?? null,
    phone: msg.phone ?? null,
    message: msg.message ?? '',
    anon_id: anonId(),
  });
  return !!res && res.ok;
}

/** Evento de analítica (GA4 y Clarity). No guarda nada propio y nunca rompe el sitio. */
export function trackEvent(name: string, params: Record<string, string> = {}): void {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.clarity === 'function') window.clarity('event', name);
  } catch {
    /* la analítica nunca debe romper el sitio */
  }
}
