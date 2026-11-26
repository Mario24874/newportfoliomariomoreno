// Cliente de la API del panel (colector del VPS, rutas /admin/*) + hook de sondeo que conserva los datos previos mientras recarga.
import { useCallback, useEffect, useRef, useState } from 'react';

export const API = ((import.meta.env.VITE_COLLECTOR_URL as string | undefined) || 'https://t.mariomoreno.work').replace(/\/$/, '');

export type Range = '24h' | '7d' | '30d' | '90d';
export interface Kpi { v: number; p: number | null; d: number | null }
export interface Summary {
  range: Range; generated_at: string; tz: string; empty: boolean;
  kpis: Record<'visits' | 'uniques' | 'returning' | 'avg_seconds' | 'short_pct' | 'demo_runs' | 'contacts' | 'reviews' | 'whatsapp' | 'unread', Kpi>;
  series: { t: string; visits: number; uniques: number }[];
  hours: number[]; countries: [string, number][]; pages: [string, number][]; sources: [string, number][];
  devices: Record<string, number>; browsers: Record<string, number>;
  funnel: { visitors: number; demo: number; contact: number };
}
export interface Live { generated_at: string; active_5min: number; last: { path: string; country: string; device: string; source: string; at: string }[] }
export interface Demos {
  range: Range; total: number; by_demo: [string, number][]; recent: { demo: string; input: string; at: string }[];
  failures: { total: number; by_demo: [string, number][]; recent: { demo: string; status: number | null; message: string; at: string }[] };
}
export interface Msg { id: string; kind: 'contacto' | 'resena'; name: string | null; email: string | null; phone: string | null; message: string | null; rating: number | null; status: 'new' | 'read' | 'archived'; at: string }
export interface Messages { items: Msg[]; total: number }
export interface Captacion { sent: number; replied: number; reply_rate: number; by_status: [string, number][]; by_country: [string, number][]; by_day: { day: string; sent: number }[]; replies: { company: string; at: string | null; subject: string }[] }
export interface Campana {
  sent: number; trial_sent: number; last_sent: string | null; delivered: number; bounced: number; by_touch: [string, number][]; by_delivery: [string, number][];
  by_day: { day: string; sent: number }[];
  prospects: { total: number; by_state: [string, number][]; by_cell: [string, number][]; by_channel: [string, number][] };
  suppressed: { total: number; by_reason: [string, number][] }; batches: [string, number][]; paused: boolean; start_date: string | null;
  unmatched_resend_events: number; recent_events: { at: string; type: string; detail: string }[]; replies_tracked: boolean;
}
export interface Salud { generated_at: string; sites: { name: string; ok: boolean; code: number; ms: number }[]; demos: { name: string; ok: boolean; status: string; at: string }[]; alerts: { at: string; source: string; severity: string; what: string; message: string }[] }
export interface Avisos { rules: { name: string; when: string }[]; recent: { at: string; type: string; title: string; state: string }[] }

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;
export const setTokenGetter = (f: TokenGetter) => { getToken = f; };

export class ApiError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export async function call<T>(path: string, params: Record<string, string> = {}, init: RequestInit = {}): Promise<T> {
  if (import.meta.env.DEV && location.search.includes('mock')) {
    const m = await import('./mock'); return m.mock(path, params) as T;
  }
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${path}${q ? `?${q}` : ''}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${await getToken()}` } });
  if (!res.ok) throw new ApiError(res.status, res.status === 401 ? 'Sesión caducada' : res.status === 403 ? 'Sin permiso' : `Error ${res.status}`);
  return init.method === 'PATCH' ? ({} as T) : path.endsWith('.csv') ? ((await res.text()) as unknown as T) : ((await res.json()) as T);
}

/** Sondeo: conserva `data` mientras recarga (loading=true) y tras un error (error!=null); nunca vacía la pantalla. */
export function useApi<T>(path: string, params: Record<string, string> = {}, every = 20000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [at, setAt] = useState(0);
  const key = path + JSON.stringify(params);
  const alive = useRef(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await call<T>(path, params); if (alive.current) { setData(d); setError(null); setAt(Date.now()); } }
    catch (e) { if (alive.current) setError(e instanceof ApiError ? e : new ApiError(0, 'Sin conexión con el colector')); }
    finally { if (alive.current) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { alive.current = true; void load(); const id = every ? setInterval(() => { if (document.visibilityState === 'visible') void load(); }, every) : 0; return () => { alive.current = false; if (id) clearInterval(id); }; }, [load, every]);
  return { data, error, loading, at, reload: load };
}
